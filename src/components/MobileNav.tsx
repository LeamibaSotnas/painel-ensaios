"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, Music2, Users } from "lucide-react";

import { podeGerenciarUsuarios } from "@/core/auth/permissoes";
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
  const exibirItemUsuarios = podeGerenciarUsuarios(usuario);

  const itens = exibirItemUsuarios ? [...ITENS_BASE, ITEM_USUARIOS] : ITENS_BASE;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-violet-100 bg-white/90 shadow-[0_-4px_20px_-8px_rgba(124,58,237,0.25)] backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {itens.map(({ href, label, icon: Icon }) => {
        const ativo = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors",
              ativo ? "font-medium text-violet-600" : "text-muted-foreground"
            )}
          >
            {ativo && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" />
            )}
            <span
              className={cn(
                "flex h-7 w-9 items-center justify-center rounded-full transition-colors",
                ativo && "bg-gradient-to-br from-violet-100 to-fuchsia-100"
              )}
            >
              <Icon className={cn("h-5 w-5", ativo && "text-violet-600")} />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default MobileNav;
