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
    <aside className="hidden w-64 flex-col gap-1 border-r border-violet-100 bg-white/60 p-4 backdrop-blur-xl md:flex">
      <div className="px-2 py-4">
        <p className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-sm font-bold leading-tight text-transparent">
          Painel de Ensaios
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {usuario.nome} · {usuario.regra}
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {itens.map(({ href, label, icon: Icon }) => {
          const ativo =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all",
                ativo
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 font-medium text-white shadow-md shadow-violet-500/25"
                  : "text-muted-foreground hover:bg-violet-50 hover:text-violet-700"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <form action={sair}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </form>
    </aside>
  );
}
