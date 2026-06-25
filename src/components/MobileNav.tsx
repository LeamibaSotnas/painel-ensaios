"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, Music2, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Usuario } from "@/types/database.types";

interface ItemNavegacao {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const ITENS_BASE: ItemNavegacao[] = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/dashboard/cronograma", label: "Cronograma", icon: CalendarDays },
  { href: "/dashboard/departamentos", label: "Deptos.", icon: Music2 },
];

const ITEM_USUARIOS: ItemNavegacao = {
  href: "/dashboard/usuarios",
  label: "Usuários",
  icon: Users,
};

/**
 * Navegação inferior fixa, exibida apenas em telas pequenas (md:hidden).
 * Substitui a sidebar nesse breakpoint — versão dedicada para mobile.
 */
export function MobileNav({ usuario }: { usuario: Usuario }) {
  const pathname = usePathname();
  const podeGerenciarUsuarios = usuario.regra === "ADMIN";

  const itens = podeGerenciarUsuarios ? [...ITENS_BASE, ITEM_USUARIOS] : ITENS_BASE;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/60 bg-white/90 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {itens.map(({ href, label, icon: Icon }) => {
        const ativo = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors",
              ativo ? "font-medium text-foreground" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", ativo && "text-primary")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default MobileNav;
