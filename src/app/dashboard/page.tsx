import { CarrosselDashboard } from "@/components/CarrosselDashboard";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import {
  contarLouvores,
  contarUsuarios,
  listarMusicasMaisUsadas,
  listarProximosEnsaios,
  listarUltimasAlteracoes,
} from "@/core/db/queries";

export default async function VisaoGeralPage() {
  const usuarioAtual = await getUsuarioAtual();
  const ehAdmin = usuarioAtual?.regra === "ADMIN";
  const meuDepartamentoId = ehAdmin ? undefined : usuarioAtual?.departamento_id ?? undefined;

  const [proximosEnsaios, totalLouvores, musicasMaisUsadas, ultimasAlteracoes, totalUsuarios] =
    await Promise.all([
      listarProximosEnsaios(10, meuDepartamentoId),
      contarLouvores(meuDepartamentoId),
      listarMusicasMaisUsadas(5, meuDepartamentoId),
      listarUltimasAlteracoes(5, meuDepartamentoId),
      ehAdmin ? contarUsuarios() : Promise.resolve(0),
    ]);

  return (
    <CarrosselDashboard
      totalLouvores={totalLouvores}
      totalUsuarios={totalUsuarios}
      ehAdmin={ehAdmin}
      proximosEnsaios={proximosEnsaios}
      musicasMaisUsadas={musicasMaisUsadas}
      ultimasAlteracoes={ultimasAlteracoes}
    />
  );
}
