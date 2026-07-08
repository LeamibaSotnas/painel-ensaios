import { revalidatePath } from "next/cache";

import { CarrosselDashboard } from "@/components/CarrosselDashboard";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import {
  atualizarStatusObservacao,
  contarLouvores,
  contarUsuarios,
  criarObservacao,
  listarMusicasMaisUsadas,
  listarObservacoes,
  listarProximosEnsaios,
  listarUltimasAlteracoes,
  removerObservacao,
} from "@/core/db/queries";
import type { CategoriaObservacao, PrioridadeObservacao } from "@/types/database.types";

export default async function VisaoGeralPage() {
  const usuarioAtual = await getUsuarioAtual();
  const ehAdmin = usuarioAtual?.regra === "ADMIN" || usuarioAtual?.regra === "ADMIN_PAINEL";
  const meuDepartamentoId = ehAdmin ? undefined : (usuarioAtual?.departamento_id ?? undefined);

  const [
    proximosEnsaios,
    totalLouvores,
    musicasMaisUsadas,
    ultimasAlteracoes,
    totalUsuarios,
    observacoes,
  ] = await Promise.all([
    listarProximosEnsaios(10, meuDepartamentoId),
    contarLouvores(meuDepartamentoId),
    listarMusicasMaisUsadas(5, meuDepartamentoId),
    listarUltimasAlteracoes(5, meuDepartamentoId),
    usuarioAtual?.regra === "ADMIN" ? contarUsuarios() : Promise.resolve(0),
    listarObservacoes(meuDepartamentoId),
  ]);

  // ── Server Actions do Mural ──────────────────────────────────────────────

  async function handleCriarObservacao(dados: {
    titulo: string;
    descricao: string;
    prioridade: PrioridadeObservacao;
    categoria: CategoriaObservacao;
    departamentoId: string | null;
  }) {
    "use server";
    if (!usuarioAtual) return;
    await criarObservacao({
      titulo: dados.titulo,
      descricao: dados.descricao,
      autorNome: usuarioAtual.nome,
      autorId: usuarioAtual.id,
      departamentoId: dados.departamentoId,
      prioridade: dados.prioridade,
      categoria: dados.categoria,
    });
    revalidatePath("/dashboard");
  }

  async function handleArquivarObservacao(id: string) {
    "use server";
    await atualizarStatusObservacao(id, "ARQUIVADA");
    revalidatePath("/dashboard");
  }

  async function handleRemoverObservacao(id: string) {
    "use server";
    await removerObservacao(id);
    revalidatePath("/dashboard");
  }

  return (
    <CarrosselDashboard
      totalLouvores={totalLouvores}
      totalUsuarios={totalUsuarios}
      ehAdmin={ehAdmin}
      proximosEnsaios={proximosEnsaios}
      musicasMaisUsadas={musicasMaisUsadas}
      ultimasAlteracoes={ultimasAlteracoes}
      observacoes={observacoes}
      onCriarObservacao={handleCriarObservacao}
      onArquivarObservacao={handleArquivarObservacao}
      onRemoverObservacao={handleRemoverObservacao}
      autorNome={usuarioAtual?.nome ?? ""}
      autorId={usuarioAtual?.id ?? ""}
      departamentoIdUsuario={usuarioAtual?.departamento_id ?? null}
    />
  );
}
