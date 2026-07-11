"use client";

import { useState, useRef } from "react";
import { Guitar, Search, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CifraClubViewerProps {
  /** Altura mínima do iframe (padrão: 600px). Na modal, controle via className. */
  alturaMinima?: number;
}

const URL_INICIAL = "https://www.cifraclub.com.br/";

export function CifraClubViewer({ alturaMinima = 600 }: CifraClubViewerProps) {
  const [busca, setBusca] = useState("");
  const [urlAtual, setUrlAtual] = useState(URL_INICIAL);
  const [recarregar, setRecarregar] = useState(0); // usado como key para forçar reload
  const inputRef = useRef<HTMLInputElement>(null);

  function pesquisar(e: React.FormEvent) {
    e.preventDefault();
    const termo = busca.trim();
    if (!termo) return;
    setUrlAtual(
      `https://www.cifraclub.com.br/busca/?q=${encodeURIComponent(termo)}`
    );
  }

  function forcarReload() {
    setRecarregar((n) => n + 1);
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* ── Barra de busca ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Guitar className="h-5 w-5 text-violet-600 shrink-0" />

        <form
          onSubmit={pesquisar}
          className="flex flex-1 min-w-0 items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar música, artista ou cifra…"
            className="flex-1 min-w-0 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm
                       outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
          <Button type="submit" size="sm">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Buscar</span>
          </Button>
        </form>

        <button
          onClick={forcarReload}
          title="Recarregar"
          className="text-muted-foreground hover:text-violet-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        <a
          href={urlAtual}
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir no navegador"
          className="text-muted-foreground hover:text-violet-600 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* ── iframe ─────────────────────────────────────────────────────────── */}
      <div
        className="flex-1 rounded-2xl overflow-hidden border border-violet-100 shadow-sm bg-white"
        style={{ minHeight: alturaMinima }}
      >
        <iframe
          key={`${urlAtual}-${recarregar}`}
          src={urlAtual}
          className="w-full h-full border-0"
          style={{ minHeight: alturaMinima }}
          title="Cifra Club"
          /*
           * allow-top-navigation-by-user-activation permite que links dentro do
           * iframe naveguem dentro do próprio iframe ao ser clicados pelo usuário,
           * sem abrir novas abas involuntariamente.
           */
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
        />
      </div>

      {/* ── Aviso de fallback ────────────────────────────────────────────── */}
      <p className="text-[11px] text-muted-foreground text-center">
        Se o site não carregar aqui, clique em{" "}
        <a
          href={urlAtual}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-violet-600"
        >
          Abrir no navegador
        </a>{" "}
        para acessar diretamente.
      </p>
    </div>
  );
}
