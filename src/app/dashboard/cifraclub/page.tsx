import { redirect } from "next/navigation";

import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import { ehAdmin } from "@/core/auth/permissoes";
import { CifraClubViewer } from "@/components/CifraClubViewer";

/**
 * Página dedicada ao Cifra Club — acessível apenas por ADMIN e ADMIN_PAINEL.
 * Renderiza o viewer em tela cheia dentro do layout do dashboard.
 */
export default async function CifraClubPage() {
  const usuario = await getUsuarioAtual();

  if (!ehAdmin(usuario)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-4" style={{ minHeight: "calc(100vh - 180px)" }}>
      <CifraClubViewer alturaMinima={500} />
    </div>
  );
}
