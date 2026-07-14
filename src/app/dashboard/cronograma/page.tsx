import { revalidatePath } from "next/cache";

import { EnsaioGrid, type EnsaioEditavel } from "@/components/EnsaioGrid";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import {
  atualizarEnsaio,
  criarEnsaio,
  criarObservacao,
  listarDepartamentos,
  listarTodosEnsaios,
  removerEnsaio,
} from "@/core/db/queries";

const CAMINHO_CRONOGRAMA = "/dashboard/cronograma";

export default async function CronogramaPage() {
  const usuarioAtual = await getUsuarioAtual();
  const ehSuperAdminAtual = usuarioAtual?.regra === "ADMIN";
  // ADMIN_PAINEL ve todos os departamentos (somente leitura — sem poder agendar/editar)
  const ehVisualizadorGeral =
    ehSuperAdminAtual || usuarioAtual?.regra === "ADMIN_PAINEL";
  const meuDepartamentoId = ehVisualizadorGeral
    ? undefined
    : usuarioAtual?.departamento_id ?? undefined;
  // Apenas ADMIN e LIDER podem agendar/editar/remover ensaios.
  // ADMIN_PAINEL e LIDER (mas não MUSICOS) podem inserir observações.
  const podeAgendarEnsaio =
    usuarioAtual?.regra === "ADMIN" || usuarioAtual?.regra === "LIDER";
  const podeInserirObservacao = usuarioAtual?.regra !== "MUSICOS";

  const departamentosTodos = await listarDepartamentos();
  const departamentos = meuDepartamentoId
    ? departamentosTodos.filter((dep) => dep.id === meuDepartamentoId)
    : departamentosTodos;
  const ensaios = await listarTodosEnsaios(meuDepartamentoId);

  // Nota: as actions abaixo retornam { erro } em vez de lançar exceção —
  // erros lançados (throw) dentro de Server Actions chegam mascarados ao
  // cliente em produção ("An error occurred in the Server Components
  // render..."), escondendo a mensagem real.
  async function handleAtualizarEnsaio(
    id: string,
    valores: EnsaioEditavel
  ): Promise<{ erro?: string }> {
    "use server";
    if (!podeAgendarEnsaio) {
      return { erro: "Você não tem permissão para editar o cronograma." };
    }
    try {
      await atualizarEnsaio(id, valores);
    } catch (erro) {
      return { erro: erro instanceof Error ? erro.message : "Falha ao salvar no banco de dados." };
    }
    revalidatePath(CAMINHO_CRONOGRAMA);
    return {};
  }

  async function handleAdicionarEnsaio(valores: EnsaioEditavel): Promise<{ erro?: string }> {
    "use server";
    if (!podeAgendarEnsaio) {
      return { erro: "Você não tem permissão para agendar ensaios." };
    }
    try {
      await criarEnsaio(valores);
    } catch (erro) {
      return { erro: erro instanceof Error ? erro.message : "Falha ao agendar no banco de dados." };
    }
    revalidatePath(CAMINHO_CRONOGRAMA);
    return {};
  }

  async function handleRemoverEnsaio(id: string): Promise<{ erro?: string }> {
    "use server";
    if (!podeAgendarEnsaio) {
      return { erro: "Você não tem permissão para remover ensaios." };
    }
    try {
      await removerEnsaio(id);
    } catch (erro) {
      return { erro: erro instanceof Error ? erro.message : "Falha ao remover no banco de dados." };
    }
    revalidatePath(CAMINHO_CRONOGRAMA);
    return {};
  }

  /**
   * Cria uma observação vinculada ao departamento do autor.
   * ADMIN (super) → departamento_id = null (broadcast global).
   * LIDER / ADMIN_PAINEL → departamento_id = seu próprio departamento.
   */
  async function handleCriarObservacaoGlobal(dados: {
    titulo: string;
    descricao: string;
    prioridade: string;
  }): Promise<{ erro?: string }> {
    "use server";
    if (!podeInserirObservacao) {
      return { erro: "Você não tem permissão para inserir observações." };
    }
    // Super Admin difunde para todos; demais usuarios vinculam ao próprio departamento.
    const deptIdAlvo =
      usuarioAtual?.regra === "ADMIN" ? null : (usuarioAtual?.departamento_id ?? null);
    try {
      await criarObservacao({
        titulo: dados.titulo,
        descricao: dados.descricao,
        autorNome: usuarioAtual?.nome ?? "Líder",
        autorId: usuarioAtual?.id ?? "",
        departamentoId: deptIdAlvo,
        prioridade: dados.prioridade as "NORMAL" | "ALTA" | "URGENTE",
        categoria: "COMUNICADO",
      });
    } catch (erro) {
      return { erro: erro instanceof Error ? erro.message : "Falha ao salvar a observação." };
    }
    revalidatePath("/dashboard");
    revalidatePath(CAMINHO_CRONOGRAMA);
    // Invalida todas as páginas de departamento para que o banner apareça imediatamente.
    revalidatePath("/dashboard/departamentos", "layout");
    return {};
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-amber-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          {ehVisualizadorGeral ? "Cronograma geral" : "Cronograma do departamento"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {ehVisualizadorGeral
            ? "Agenda de ensaios de todos os departamentos."
            : "Agenda de ensaios do seu departamento."}
        </p>
      </header>

      <EnsaioGrid
        data={ensaios}
        departamentos={departamentos}
        editavel={podeAgendarEnsaio}
        onAtualizarEnsaio={handleAtualizarEnsaio}
        onAdicionarEnsaio={handleAdicionarEnsaio}
        onRemoverEnsaio={handleRemoverEnsaio}
        onCriarObservacao={podeInserirObservacao ? handleCriarObservacaoGlobal : undefined}
      />
    </div>
  );
}
