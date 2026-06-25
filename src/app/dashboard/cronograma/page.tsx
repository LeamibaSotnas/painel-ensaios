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
  const ehSuperAdminAtual = usuarioAtual?.regra === "ADMIN";
  const meuDepartamentoId = ehSuperAdminAtual ? undefined : usuarioAtual?.departamento_id ?? undefined;
  // Membro (MUSICOS) só visualiza o cronograma; os demais papéis podem agendar/editar/remover.
  const podeEditarCronograma = usuarioAtual?.regra !== "MUSICOS";

  const departamentosTodos = await listarDepartamentos();
  const departamentos = meuDepartamentoId
    ? departamentosTodos.filter((dep) => dep.id === meuDepartamentoId)
    : departamentosTodos;
  const ensaios = await listarTodosEnsaios(meuDepartamentoId);

  async function handleAtualizarEnsaio(id: string, valores: EnsaioEditavel) {
    "use server";
    if (!podeEditarCronograma) {
      throw new Error("Você não tem permissão para editar o cronograma.");
    }
    await atualizarEnsaio(id, valores);
    revalidatePath(CAMINHO_CRONOGRAMA);
  }

  async function handleAdicionarEnsaio(valores: EnsaioEditavel) {
    "use server";
    if (!podeEditarCronograma) {
      throw new Error("Você não tem permissão para agendar ensaios.");
    }
    await criarEnsaio(valores);
    revalidatePath(CAMINHO_CRONOGRAMA);
  }

  async function handleRemoverEnsaio(id: string) {
    "use server";
    if (!podeEditarCronograma) {
      throw new Error("Você não tem permissão para remover ensaios.");
    }
    await removerEnsaio(id);
    revalidatePath(CAMINHO_CRONOGRAMA);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-amber-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          {ehSuperAdminAtual ? "Cronograma geral" : "Cronograma do departamento"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {ehSuperAdminAtual
            ? "Agenda de ensaios de todos os departamentos."
            : "Agenda de ensaios do seu departamento."}
        </p>
      </header>

      <EnsaioGrid
        data={ensaios}
        departamentos={departamentos}
        editavel={podeEditarCronograma}
        onAtualizarEnsaio={handleAtualizarEnsaio}
        onAdicionarEnsaio={handleAdicionarEnsaio}
        onRemoverEnsaio={handleRemoverEnsaio}
      />
    </div>
  );
}
