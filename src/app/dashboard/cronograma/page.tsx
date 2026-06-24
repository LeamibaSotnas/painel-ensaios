import { revalidatePath } from "next/cache";

import { EnsaioGrid, type EnsaioEditavel } from "@/components/EnsaioGrid";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import {
  atualizarEnsaio,
  criarEnsaio,
  listarDepartamentos,
  listarTodosEnsaios,
  removerEnsaio,
} from "@/core/db/queries";

const CAMINHO_CRONOGRAMA = "/dashboard/cronograma";

export default async function CronogramaPage() {
  const usuarioAtual = await getUsuarioAtual();
  const ehAdmin = usuarioAtual?.regra === "ADMIN";
  const meuDepartamentoId = ehAdmin ? undefined : usuarioAtual?.departamento_id ?? undefined;

  const departamentosTodos = await listarDepartamentos();
  const departamentos = meuDepartamentoId
    ? departamentosTodos.filter((dep) => dep.id === meuDepartamentoId)
    : departamentosTodos;
  const ensaios = await listarTodosEnsaios(meuDepartamentoId);

  async function handleAtualizarEnsaio(id: string, valores: EnsaioEditavel) {
    "use server";
    await atualizarEnsaio(id, valores);
    revalidatePath(CAMINHO_CRONOGRAMA);
  }

  async function handleAdicionarEnsaio(valores: EnsaioEditavel) {
    "use server";
    await criarEnsaio(valores);
    revalidatePath(CAMINHO_CRONOGRAMA);
  }

  async function handleRemoverEnsaio(id: string) {
    "use server";
    await removerEnsaio(id);
    revalidatePath(CAMINHO_CRONOGRAMA);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {ehAdmin ? "Cronograma geral" : "Cronograma do departamento"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {ehAdmin
            ? "Agenda de ensaios de todos os departamentos."
            : "Agenda de ensaios do seu departamento."}
        </p>
      </header>

      <EnsaioGrid
        data={ensaios}
        departamentos={departamentos}
        onAtualizarEnsaio={handleAtualizarEnsaio}
        onAdicionarEnsaio={handleAdicionarEnsaio}
        onRemoverEnsaio={handleRemoverEnsaio}
      />
    </div>
  );
}
