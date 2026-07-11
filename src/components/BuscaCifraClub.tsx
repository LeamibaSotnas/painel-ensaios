"use client";

import { useState } from "react";
import { Guitar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CifraClubViewer } from "@/components/CifraClubViewer";

/**
 * Botão compacto (cabeçalho do dashboard) que abre o Cifra Club em um
 * overlay modal de tela cheia, sem sair da página atual.
 *
 * Visível apenas para admins — o controle de exibição é feito no layout pai.
 */
export function BuscaCifraClub() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      {/* ── Botão de gatilho — gradiente em destaque ──────────────────────── */}
      <button
        onClick={() => setAberto(true)}
        className={[
          "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white",
          "bg-gradient-to-r from-fuchsia-500 via-violet-600 to-purple-600",
          "shadow-md shadow-fuchsia-500/35",
          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-fuchsia-500/45",
          "active:scale-95",
        ].join(" ")}
      >
        <Guitar className="h-3.5 w-3.5" />
        Cifra Club
      </button>

      {/* ── Overlay modal ────────────────────────────────────────────────── */}
      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6
                     bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            // Fecha ao clicar fora do painel
            if (e.target === e.currentTarget) setAberto(false);
          }}
        >
          <div className="relative flex flex-col w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden"
               style={{ height: "92vh" }}>

            {/* Cabeçalho da modal */}
            <div className="flex items-center gap-2 px-4 py-3 shrink-0
                            bg-gradient-to-r from-violet-600 to-fuchsia-500">
              <Guitar className="h-5 w-5 text-white shrink-0" />
              <span className="text-white font-bold text-sm tracking-wide flex-1">
                Cifra Club
              </span>
              <button
                onClick={() => setAberto(false)}
                className="text-white/80 hover:text-white transition-colors"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conteúdo: viewer reutilizável */}
            <div className="flex-1 overflow-hidden p-3 flex flex-col">
              <CifraClubViewer alturaMinima={400} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
