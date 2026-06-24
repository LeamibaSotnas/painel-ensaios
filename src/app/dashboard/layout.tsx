import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const usuario = await getUsuarioAtual();

  if (!usuario) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar usuario={usuario} />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end border-b px-6 py-4">
          <span className="text-sm text-muted-foreground">
            {usuario.nome} · {usuario.regra}
          </span>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
