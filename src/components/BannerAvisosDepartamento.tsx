"use client";

/**
 * BannerAvisosDepartamento — exibido na página de cada departamento.
 *
 * Mostra avisos/observações não lidos para usuários sem permissão de edição
 * (ADMIN_PAINEL e MUSICOS). Para ADMIN e LIDER o banner é ocultado — eles
 * gerenciam os avisos pelo Mural do dashboard, que já exibe tudo.
 *
 * Usa localStorage ("dept-avisos-lidos-v1") para rastrear leituras.
 */

import * as React from "react";
import {
  AlertTriangle,
  Bell,
  BellRing,
  Building2,
  ChevronDown,
  ChevronUp,
  Flame,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ObservacaoMural, PrioridadeObservacao } from "@/types/database.types";

// ──────────────────────────────────────────────────────────────────────────────
// localStorage helpers
// ──────────────────────────────────────────────────────────────────────────────

const LS_KEY = "dept-avisos-lidos-v1";

function getLidas(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function marcarLida(id: string) {
  if (typeof window === "undefined") return;
  try {
    const s = getLidas();
    s.add(id);
    localStorage.setItem(LS_KEY, JSON.stringify([...s]));
  } catch {/* silencia */}
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers visuais
// ──────────────────────────────────────────────────────────────────────────────

const PRIORIDADE_ESTILOS: Record<
  PrioridadeObservacao,
  { borda: string; fundo: string; texto: string; dot: string }
> = {
  NORMAL:  { borda: "border-violet-300/60",  fundo: "bg-violet-50/80",  texto: "text-violet-800",  dot: "bg-violet-400" },
  ALTA:    { borda: "border-amber-400/60",   fundo: "bg-amber-50/80",   texto: "text-amber-800",   dot: "bg-amber-500" },
  URGENTE: { borda: "border-rose-400/70",    fundo: "bg-rose-50/80",    texto: "text-rose-800",    dot: "bg-rose-500 animate-pulse" },
};

function formatarData(ts: string): string {
  const d = new Date(ts.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return ts.slice(0, 10);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return "ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// ──────────────────────────────────────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────────────────────────────────────

interface Props {
  observacoes: ObservacaoMural[];
  nomeDepartamento: string;
  /** true = ADMIN ou LIDER → banner escondido (eles usam o Mural do dashboard) */
  ehEditor: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
// Componente
// ──────────────────────────────────────────────────────────────────────────────

export function BannerAvisosDepartamento({ observacoes, nomeDepartamento, ehEditor }: Props) {
  const [lidas, setLidas] = React.useState<Set<string>>(new Set());
  const [expandido, setExpandido] = React.useState(true);
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    setLidas(getLidas());
    setInitialized(true);
  }, []);

  if (ehEditor || !initialized) return null;

  const naoLidas = observacoes.filter((o) => !lidas.has(o.id));
  if (naoLidas.length === 0) return null;

  const temUrgente = naoLidas.some((o) => o.prioridade === "URGENTE");

  function lerTodas() {
    naoLidas.forEach((o) => marcarLida(o.id));
    setLidas(new Set(observacoes.map((o) => o.id)));
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border shadow-lg",
        temUrgente
          ? "border-rose-300 shadow-rose-100"
          : "border-amber-300 shadow-amber-100"
      )}
      style={{ animation: "card-enter 0.3s ease-out both" }}
    >
      {/* Cabeçalho */}
      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3.5 text-left",
          temUrgente
            ? "bg-gradient-to-r from-rose-500 to-red-500"
            : "bg-gradient-to-r from-amber-500 to-orange-500"
        )}
      >
        {/* Ícone piscante para urgente */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20">
          {temUrgente ? (
            <BellRing
              className="h-4 w-4 text-white"
              style={{ animation: "bell-ring 1.4s ease-in-out infinite" }}
            />
          ) : (
            <Bell className="h-4 w-4 text-white" />
          )}
        </div>

        <div className="flex-1">
          <p className="text-sm font-black text-white">
            {naoLidas.length === 1
              ? "1 aviso não lido"
              : `${naoLidas.length} avisos não lidos`}
            {" "}
            <span className="font-medium opacity-80">· {nomeDepartamento}</span>
          </p>
          <p className="text-[11px] text-white/70">
            {temUrgente ? "⚠ Há avisos urgentes — leia com atenção" : "Novos comunicados disponíveis"}
          </p>
        </div>

        <span className="text-white/80">
          {expandido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {/* Lista de avisos */}
      {expandido && (
        <div className="flex flex-col divide-y divide-slate-100 bg-white/95">
          {naoLidas.map((obs) => {
            const est = PRIORIDADE_ESTILOS[obs.prioridade];
            return (
              <div
                key={obs.id}
                className={cn("flex gap-3 px-4 py-3.5", est.fundo)}
              >
                {/* Indicador de prioridade */}
                <span
                  className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", est.dot)}
                />

                <div className="min-w-0 flex-1">
                  {/* Badges */}
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    {/* Sempre mostra o departamento contextual — global ou específico */}
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-300 bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                      <Building2 className="h-3 w-3" />
                      {obs.departamento_nome ?? nomeDepartamento}
                    </span>
                    {obs.prioridade === "URGENTE" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                        <Flame className="h-3 w-3" />
                        Urgente
                      </span>
                    )}
                    {obs.prioridade === "ALTA" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        <Zap className="h-3 w-3" />
                        Alta prioridade
                      </span>
                    )}
                    {obs.prioridade === "NORMAL" && obs.categoria === "AVISO" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                        <AlertTriangle className="h-3 w-3" />
                        Aviso
                      </span>
                    )}
                  </div>

                  <p className={cn("text-sm font-bold", est.texto)}>{obs.titulo}</p>
                  {obs.descricao && (
                    <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
                      {obs.descricao}
                    </p>
                  )}
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    {obs.autor_nome} · {formatarData(obs.criado_em)}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Footer: marcar como lido */}
          <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
            <p className="text-[11px] text-muted-foreground">
              {naoLidas.length} {naoLidas.length === 1 ? "aviso" : "avisos"} aguardando leitura
            </p>
            <button
              type="button"
              onClick={lerTodas}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-50 hover:text-violet-700"
            >
              Marcar todos como lidos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BannerAvisosDepartamento;
