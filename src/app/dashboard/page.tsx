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
  removerObservacaoAction,
} from "./actions";

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
      autorNome={nome}
      autorId={uid}
      departamentoIdUsuario={usuarioAtual?.departamento_id ?? null}
    />
  );
}
