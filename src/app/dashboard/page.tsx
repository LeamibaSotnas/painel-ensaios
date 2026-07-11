import { CarrosselDashboard } from "@/components/CarrosselDashboard";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import {
  contarLouvores,
  contarUsuarios,
  listarMusicasMaisUsadas,
  listarObservacoes,
  listarProximosEnsaios,
  listarUltimasAlteracoes,
} from "@/core/db/queries";
import {
  arquivarObservacaoAction,
  criarObservacaoAction,
  editarObservacaoAction,
  removerObservacaoAction,
} from "./actions";

export default async function VisaoGeralPage() {
  const usuarioAtual = await getUsuarioAtual();
  const ehAdmin = usuarioAtual?.regra === "ADMIN" || usuarioAtual?.regra === "ADMIN_PAINEL";
  const meuDepartamentoId = ehAdmin ? undefined : (usuarioAtual?.departamento_id ?? undefined);

  // Cada query tem .catch() individual para que uma falha isolada
  // (ex.: tabela ainda não migrada) não derrube a página inteira.
  const [
    proximosEnsaios,
    totalLouvores,
    musicasMaisUsadas,
    ultimasAlteracoes,
    totalUsuarios,
    observacoes,
  ] = await Promise.all([
    listarProximosEnsaios(10, meuDepartamentoId).catch(() => [] as Awaited<ReturnType<typeof listarProximosEnsaios>>),
    contarLouvores(meuDepartamentoId).catch(() => 0),
    listarMusicasMaisUsadas(5, meuDepartamentoId).catch(() => [] as Awaited<ReturnType<typeof listarMusicasMaisUsadas>>),
    listarUltimasAlteracoes(5, meuDepartamentoId).catch(() => [] as Awaited<ReturnType<typeof listarUltimasAlteracoes>>),
    (usuarioAtual?.regra === "ADMIN" ? contarUsuarios() : Promise.resolve(0)).catch(() => 0),
    listarObservacoes(meuDepartamentoId).catch(() => [] as Awaited<ReturnType<typeof listarObservacoes>>),
  ]);

  // ── Server Actions do Mural (vinculadas via .bind para evitar closure) ──
  const nome = usuarioAtual?.nome ?? "";
  const uid  = usuarioAtual?.id   ?? "";

  return (
    <CarrosselDashboard
      totalLouvores={totalLouvores}
      totalUsuarios={totalUsuarios}
      ehAdmin={ehAdmin}
      proximosEnsaios={proximosEnsaios}
      musicasMaisUsadas={musicasMaisUsadas}
      ultimasAlteracoes={ultimasAlteracoes}
      observacoes={observacoes}
      onCriarObservacao={criarObservacaoAction.bind(null, nome, uid)}
      onArquivarObservacao={arquivarObservacaoAction}
      onRemoverObservacao={removerObservacaoAction}
      onEditarObservacao={editarObservacaoAction}
      autorNome={nome}
      autorId={uid}
      departamentoIdUsuario={usuarioAtual?.departamento_id ?? null}
    />
  );
}
