import { revalidatePath } from "next/cache";

import {
  EnsaioGrid,
  type EnsaioEditavel,
  type EnsaioGradeComDepartamento,
} from "@/components/EnsaioGrid";
import {
  atualizarEnsaio,
  criarEnsaio,
  listarDepartamentos,
  listarTodosEnsaios,
  removerEnsaio,
} from "@/core/db/queries";

const CAMINHO_CRONOGRAMA = "/dashboard/cronograma";

export default async function CronogramaPage() {
  const departamentos = listarDepartamentos();
  const ensaiosRaw = listarTodosEnsaios();

  const ensaios: EnsaioGradeComDepartamento[] = ensaiosRaw.map((ensaio) => ({
    id: ensaio.id,
    data: ensaio.data,
    hora_inicio: ensaio.hora_inicio,
    hora_fim: ensaio.hora_fim,
    departamento_id: ensaio.departamento_id,
    departamento: {
      nome: ensaio.departamento_nome,
      slug: ensaio.departamento_slug,
    },
  }));

  async function handleAtualizarEnsaio(id: string, valores: EnsaioEditavel) {
    "use server";
    atualizarEnsaio(id, valores);
    revalidatePath(CAMINHO_CRONOGRAMA);
  }

  async function handleAdicionarEnsaio(valores: EnsaioEditavel) {
    "use server";
    criarEnsaio(valores);
    revalidatePath(CAMINHO_CRONOGRAMA);
  }

  async function handleRemoverEnsaio(id: string) {
    "use server";
    removerEnsaio(id);
    revalidatePath(CAMINHO_CRONOGRAMA);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Cronograma geral</h1>
        <p className="text-sm text-muted-foreground">
          Agenda de ensaios de todos os departamentos.
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
