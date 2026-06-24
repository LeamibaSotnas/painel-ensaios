import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";

// Esta área usa sessão (cookies) e o banco Postgres em tempo real —
// nunca deve ser pré-renderizada estaticamente no build.
export const dynamic = "force-dynamic";

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
        <header className="flex items-center justify-end border-b border-white/60 bg-white/50 px-6 py-4 backdrop-blur-sm">
          <span className="text-sm text-muted-foreground">
            {usuario.nome} · {usuario.regra}
          </span>
        </header>
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-6xl rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
