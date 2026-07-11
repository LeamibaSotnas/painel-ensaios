"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Guitar,
  LayoutDashboard,
  LogOut,
  Music2,
  Users,
} from "lucide-react";

import { sair } from "@/app/login-actions";
import { Button } from "@/components/ui/button";
import { ehAdmin, podeGerenciarUsuarios } from "@/core/auth/permissoes";
import { cn } from "@/lib/utils";
import type { Usuario } from "@/types/database.types";

interface ItemNavegacao {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const ITENS_BASE: ItemNavegacao[] = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/dashboard/cronograma", label: "Cronograma", icon: CalendarDays },
  { href: "/dashboard/departamentos", label: "Departamentos", icon: Music2 },
];

const ITEM_USUARIOS: ItemNavegacao = {
  href: "/dashboard/usuarios",
  label: "Usuários",
  icon: Users,
};

const ITEM_CIFRACLUB: ItemNavegacao = {
  href: "/dashboard/cifraclub",
  label: "Cifra Club",
  icon: Guitar,
};

export function DashboardSidebar({ usuario }: { usuario: Usuario }) {
  const pathname = usePathname();
  const exibirItemUsuarios = podeGerenciarUsuarios(usuario);
  const exibirCifraClub = ehAdmin(usuario);

  const itens = [
    ...ITENS_BASE,
    ...(exibirItemUsuarios ? [ITEM_USUARIOS] : []),
    ...(exibirCifraClub ? [ITEM_CIFRACLUB] : []),
  ];

  return (
    <aside
      className="hidden w-64 flex-col gap-1 border-r border-white/10 p-4 backdrop-blur-2xl md:flex"
      style={{ background: "rgba(0,30,80,0.92)" }}
    >
      {/* Logo */}
      <div className="px-2 py-4">
        <p className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-100 bg-clip-text text-sm font-black leading-tight text-transparent tracking-wide">
          Painel de Ensaios
        </p>
        <p className="mt-1 text-[11px] text-sky-300/60">
          {usuario.nome} · {usuario.regra}
        </p>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-0.5">
        {itens.map(({ href, label, icon: Icon }) => {
          const ativo = pathname === href || pathname.startsWith(`${href}/`);
          const isCifra = href === "/dashboard/cifraclub";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                ativo
                  ? "bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-900 shadow-lg shadow-sky-500/35 scale-[1.02]"
                  : isCifra
                  ? "text-fuchsia-300 hover:bg-fuchsia-500/15 hover:text-fuchsia-100 hover:shadow-sm hover:shadow-fuchsia-500/20"
                  : "text-sky-100/65 hover:bg-white/10 hover:text-white hover:shadow-sm"
              )}
            >
              {/* Indicador lateral para item ativo */}
              {ativo && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-white/60" />
              )}
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  ativo ? "text-slate-900" : isCifra ? "text-fuchsia-300" : ""
                )}
              />
              <span className="flex-1">{label}</span>
              {isCifra && !ativo && (
                <span className="rounded-full bg-fuchsia-500/25 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-fuchsia-200">
                  PRO
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sair */}
      <div className="mt-2 border-t border-white/10 pt-2">
        <form action={sair}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sky-200/50 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </form>
      </div>
    </aside>
  );
}
