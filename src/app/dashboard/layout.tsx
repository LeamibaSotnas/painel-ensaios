import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { MobileNav } from "@/components/MobileNav";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import { sair } from "@/app/login-actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

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
    <div className="flex min-h-screen flex-col md:flex-row">
      <DashboardSidebar usuario={usuario} />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/60 bg-white/50 px-4 py-3 backdrop-blur-sm md:justify-end md:px-6 md:py-4">
          <span className="text-sm font-semibold md:hidden">Painel de Ensaios</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {usuario.nome} · {usuario.regra}
            </span>
            <form action={sair} className="md:hidden">
              <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">
          <div className="mx-auto max-w-6xl rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-sm md:p-6">
            {children}
          </div>
        </main>
        <MobileNav usuario={usuario} />
      </div>
    </div>
  );
}
