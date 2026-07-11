"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Guitar, LayoutDashboard, Music2, Users } from "lucide-react";

import { ehAdmin, podeGerenciarUsuarios } from "@/core/auth/permissoes";
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

const ITEM_CIFRACLUB: ItemNavegacao = {
  href: "/dashboard/cifraclub",
  label: "Cifras",
  icon: Guitar,
};

/**
 * Navegação inferior fixa, exibida apenas em telas pequenas (md:hidden).
 * Substitui a sidebar nesse breakpoint — versão dedicada para mobile.
 */
export function MobileNav({ usuario }: { usuario: Usuario }) {
  const pathname = usePathname();
  const exibirItemUsuarios = podeGerenciarUsuarios(usuario);
  const exibirCifraClub = ehAdmin(usuario);

  const itens = [
    ...ITENS_BASE,
    ...(exibirItemUsuarios ? [ITEM_USUARIOS] : []),
    ...(exibirCifraClub ? [ITEM_CIFRACLUB] : []),
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 backdrop-blur-2xl md:hidden"
      style={{
        background: "rgba(0,18,55,0.90)",
        boxShadow: "0 -4px 32px -4px rgba(0,80,200,0.30), 0 -1px 0 rgba(255,255,255,0.08)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {itens.map(({ href, label, icon: Icon }) => {
        const ativo = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
              "transition-all duration-200 active:scale-90",
              ativo ? "text-sky-300" : "text-sky-100/45 hover:text-sky-100/70"
            )}
          >
            {/* Linha indicadora superior com glow */}
            {ativo && (
              <span
                className="absolute top-0 h-[2px] w-10 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"
                style={{ boxShadow: "0 0 8px rgba(56,189,248,0.85)" }}
              />
            )}

            {/* Ícone em pílula com glow quando ativo */}
            <span
              className={cn(
                "flex h-8 w-11 items-center justify-center rounded-2xl transition-all duration-200",
                ativo
                  ? "bg-gradient-to-br from-sky-500/25 to-cyan-500/15 shadow-md shadow-sky-500/25"
                  : "hover:bg-white/8"
              )}
            >
              <Icon
                className={cn("h-5 w-5 transition-all duration-200", ativo && "scale-110")}
                style={ativo ? { filter: "drop-shadow(0 0 6px rgba(56,189,248,0.80))" } : undefined}
              />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default MobileNav;
