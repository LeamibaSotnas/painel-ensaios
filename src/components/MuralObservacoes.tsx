"use client";

import * as React from "react";
import {
  AlertTriangle,
  Bell,
  BellRing,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Flame,
  Megaphone,
  MessageSquarePlus,
  Music2,
  RefreshCw,
  Shield,
  Tag,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  CategoriaObservacao,
  ObservacaoMural,
  PrioridadeObservacao,
} from "@/types/database.types";

// ---------------------------------------------------------------------------
// Configurações visuais
// ---------------------------------------------------------------------------

const CATEGORIA_CONFIG: Record<
  CategoriaObservacao,
  { label: string; icon: React.ReactNode; color: string }
> = {
  AVISO: {
    label: "Aviso",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  COMUNICADO: {
    label: "Comunicado",
    icon: <Megaphone className="h-3.5 w-3.5" />,
    color: "text-sky-600 bg-sky-50 border-sky-200",
  },
  ENSAIO: {
    label: "Ensaio",
    icon: <Music2 className="h-3.5 w-3.5" />,
    color: "text-violet-600 bg-violet-50 border-violet-200",
  },
  MUDANCA: {
    label: "Mudança",
    icon: <RefreshCw className="h-3.5 w-3.5" />,
    color: "text-orange-600 bg-orange-50 border-orange-200",
  },
  ESCALA: {
    label: "Escala",
    icon: <Users className="h-3.5 w-3.5" />,
    color: "text-teal-600 bg-teal-50 border-teal-200",
  },
  URGENTE: {
    label: "Urgente",
    icon: <Flame className="h-3.5 w-3.5" />,
    color: "text-rose-600 bg-rose-50 border-rose-200",
  },
};

const PRIORIDADE_CONFIG: Record<
  PrioridadeObservacao,
  { label: string; dot: string; badge: string }
> = {
  NORMAL: {
    label: "Normal",
    dot: "bg-slate-400",
    badge: "text-slate-600 bg-slate-100 border-slate-200",
  },
  ALTA: {
    label: "Alta",
    dot: "bg-amber-500",
    badge: "text-amber-700 bg-amber-50 border-amber-200",
  },
  URGENTE: {
    label: "Urgente",
    dot: "bg-rose-500 animate-pulse",
    badge: "text-rose-700 bg-rose-50 border-rose-200",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LS_KEY = "mural-lidas-v1";

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
    const lidas = getLidas();
    lidas.add(id);
    localStorage.setItem(LS_KEY, JSON.stringify([...lidas]));
  } catch {
    // silencia erros de localStorage
  }
}

function formatarData(ts: string) {
  const d = new Date(ts.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return ts.slice(0, 10);
  const hoje = new Date();
  const diff = Math.floor((hoje.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return "ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  observacoes: ObservacaoMural[];
  ehAdmin: boolean;
  autorNome: string;
  autorId: string;
  departamentoId: string | null;
  /** Server actions injetadas via page.tsx */
  onCriar: (dados: {
    titulo: string;
    descricao: string;
    prioridade: PrioridadeObservacao;
    categoria: CategoriaObservacao;
    departamentoId: string | null;
  }) => Promise<void>;
  onArquivar: (id: string) => Promise<void>;
  onRemover: (id: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Cartão de observação
// ---------------------------------------------------------------------------

function CartaoObservacao({
  obs,
  lida,
  ehAdmin,
  onLer,
  onArquivar,
  onRemover,
}: {
  obs: ObservacaoMural;
  lida: boolean;
  ehAdmin: boolean;
  onLer: (id: string) => void;
  onArquivar: (id: string) => Promise<void>;
  onRemover: (id: string) => Promise<void>;
}) {
  const [expandida, setExpandida] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const cat = CATEGORIA_CONFIG[obs.categoria];
  const pri = PRIORIDADE_CONFIG[obs.prioridade];

  function handleExpand() {
    setExpandida((v) => !v);
    if (!lida) onLer(obs.id);
  }

  async function handleArquivar() {
    setLoading(true);
    try { await onArquivar(obs.id); } finally { setLoading(false); }
  }

  async function handleRemover() {
    if (!confirm("Remover esta observação permanentemente?")) return;
    setLoading(true);
    try { await onRemover(obs.id); } finally { setLoading(false); }
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-0 overflow-hidden rounded-xl border transition-all duration-200",
        lida
          ? "border-slate-200 bg-white/70"
          : obs.prioridade === "URGENTE"
          ? "border-rose-300 bg-rose-50/60 shadow-md shadow-rose-100"
          : obs.prioridade === "ALTA"
          ? "border-amber-300 bg-amber-50/50 shadow-md shadow-amber-100"
          : "border-violet-200 bg-violet-50/40 shadow-sm"
      )}
    >
      {/* barra lateral colorida de prioridade */}
      <div
        className={cn("absolute left-0 top-0 h-full w-1 rounded-l-xl", pri.dot.replace("animate-pulse", ""))}
      />

      <button
        type="button"
        onClick={handleExpand}
        className="flex w-full items-start gap-3 px-4 py-3 pl-5 text-left"
      >
        {/* indicador não-lida */}
        <span className="mt-1 shrink-0">
          {!lida ? (
            <Circle className="h-2 w-2 fill-violet-500 text-violet-500" />
          ) : (
            <Circle className="h-2 w-2 fill-slate-300 text-slate-300" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* badge categoria */}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                cat.color
              )}
            >
              {cat.icon}
              {cat.label}
            </span>
            {/* badge prioridade (só se não normal) */}
            {obs.prioridade !== "NORMAL" && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  pri.badge
                )}
              >
                {obs.prioridade === "URGENTE" && <Flame className="h-3 w-3" />}
                {obs.prioridade === "ALTA" && <Zap className="h-3 w-3" />}
                {pri.label}
              </span>
            )}
          </div>

          <p className={cn("mt-1 text-sm font-semibold", lida ? "text-slate-700" : "text-slate-900")}>
            {obs.titulo}
          </p>

          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Shield className="h-3 w-3 shrink-0" />
            <span>{obs.autor_nome}</span>
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{formatarData(obs.criado_em)}</span>
          </div>
        </div>

        <span className="ml-auto mt-1 shrink-0 text-muted-foreground">
          {expandida ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {/* Corpo expandido */}
      {expandida && (
        <div className="border-t border-slate-100 px-5 pb-3 pt-2">
          {obs.descricao && (
            <p className="whitespace-pre-wrap text-sm text-slate-700">{obs.descricao}</p>
          )}

          {ehAdmin && (
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleArquivar}
                disabled={loading}
                className="h-7 gap-1 px-2 text-xs text-slate-500 hover:text-amber-600"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Arquivar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemover}
                disabled={loading}
                className="h-7 gap-1 px-2 text-xs text-slate-500 hover:text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remover
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulário de nova observação
// ---------------------------------------------------------------------------

const CATEGORIAS: CategoriaObservacao[] = [
  "AVISO", "COMUNICADO", "ENSAIO", "MUDANCA", "ESCALA", "URGENTE",
];

function FormNovaObservacao({
  onSalvar,
  onCancelar,
}: {
  onSalvar: (dados: {
    titulo: string;
    descricao: string;
    prioridade: PrioridadeObservacao;
    categoria: CategoriaObservacao;
  }) => Promise<void>;
  onCancelar: () => void;
}) {
  const [titulo, setTitulo] = React.useState("");
  const [descricao, setDescricao] = React.useState("");
  const [prioridade, setPrioridade] = React.useState<PrioridadeObservacao>("NORMAL");
  const [categoria, setCategoria] = React.useState<CategoriaObservacao>("COMUNICADO");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    setLoading(true);
    try {
      await onSalvar({ titulo: titulo.trim(), descricao: descricao.trim(), prioridade, categoria });
      onCancelar();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-violet-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm"
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold text-violet-700">
        <MessageSquarePlus className="h-4 w-4" />
        Nova observação
      </h3>

      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título *"
        required
        maxLength={120}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
      />

      <textarea
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Descrição (opcional)"
        rows={3}
        maxLength={800}
        className="resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
      />

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted-foreground">Categoria</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaObservacao)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-violet-400"
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {CATEGORIA_CONFIG[c].label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted-foreground">Prioridade</label>
          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value as PrioridadeObservacao)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-violet-400"
          >
            <option value="NORMAL">Normal</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading || !titulo.trim()} className="h-8 text-xs">
          {loading ? "Salvando…" : "Publicar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancelar}
          className="h-8 text-xs"
        >
          <X className="h-3.5 w-3.5" />
          Cancelar
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function MuralObservacoes({
  observacoes: inicial,
  ehAdmin,
  autorNome,
  autorId,
  departamentoId,
  onCriar,
  onArquivar,
  onRemover,
}: Props) {
  const router = useRouter();
  const [lidas, setLidas] = React.useState<Set<string>>(new Set());
  const [criando, setCriando] = React.useState(false);
  const [minimizado, setMinimizado] = React.useState(false);

  // Carrega lidas do localStorage no cliente
  React.useEffect(() => {
    setLidas(getLidas());
  }, []);

  // Polling: revalida a página a cada 30s para mostrar novas observações
  React.useEffect(() => {
    const t = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(t);
  }, [router]);

  const naoLidas = inicial.filter((o) => !lidas.has(o.id));
  const totalNaoLidas = naoLidas.length;
  const temUrgente = naoLidas.some((o) => o.prioridade === "URGENTE");

  function handleLer(id: string) {
    marcarLida(id);
    setLidas((prev) => new Set([...prev, id]));
  }

  function handleLerTodas() {
    inicial.forEach((o) => marcarLida(o.id));
    setLidas(new Set(inicial.map((o) => o.id)));
  }

  async function handleCriar(dados: {
    titulo: string;
    descricao: string;
    prioridade: PrioridadeObservacao;
    categoria: CategoriaObservacao;
  }) {
    await onCriar({ ...dados, departamentoId });
    router.refresh();
  }

  async function handleArquivar(id: string) {
    await onArquivar(id);
    router.refresh();
  }

  async function handleRemover(id: string) {
    await onRemover(id);
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-3">
      {/* Cabeçalho do mural */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMinimizado((v) => !v)}
          className="flex flex-1 items-center gap-2.5 text-left"
        >
          {/* Ícone de notificação com badge */}
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100">
            {totalNaoLidas > 0 ? (
              <BellRing
                className={cn(
                  "h-4 w-4 text-violet-600",
                  temUrgente && "text-rose-600"
                )}
              />
            ) : (
              <Bell className="h-4 w-4 text-violet-500" />
            )}

            {totalNaoLidas > 0 && (
              <span
                className={cn(
                  "absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white",
                  temUrgente
                    ? "bg-rose-500 shadow-lg shadow-rose-500/50 animate-pulse"
                    : "bg-violet-500 shadow-md shadow-violet-500/40"
                )}
              >
                {totalNaoLidas > 9 ? "9+" : totalNaoLidas}
              </span>
            )}
          </div>

          <div>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <Tag className="h-3.5 w-3.5 text-violet-500" />
              Mural de observações
              {totalNaoLidas > 0 && (
                <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                  {totalNaoLidas} {totalNaoLidas === 1 ? "nova" : "novas"}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {inicial.length === 0
                ? "Nenhuma observação ativa"
                : `${inicial.length} ${inicial.length === 1 ? "observação" : "observações"} ativas`}
            </p>
          </div>

          <span className="ml-auto text-muted-foreground">
            {minimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </span>
        </button>

        {/* Ações do admin */}
        {ehAdmin && !minimizado && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCriando(true)}
            className="h-8 gap-1.5 text-xs"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Nova
          </Button>
        )}
      </div>

      {/* Conteúdo */}
      {!minimizado && (
        <div className="flex flex-col gap-2">
          {/* Formulário de criação */}
          {criando && (
            <FormNovaObservacao
              onSalvar={handleCriar}
              onCancelar={() => setCriando(false)}
            />
          )}

          {/* Lista de observações */}
          {inicial.length === 0 && !criando ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-violet-200 bg-violet-50/40 px-4 py-8 text-center">
              <Bell className="h-8 w-8 text-violet-300" />
              <p className="text-sm text-muted-foreground">
                {ehAdmin
                  ? "Nenhuma observação ativa. Clique em Nova para criar."
                  : "Nenhuma observação no momento."}
              </p>
            </div>
          ) : (
            <>
              {totalNaoLidas > 1 && (
                <button
                  type="button"
                  onClick={handleLerTodas}
                  className="self-end text-[11px] text-violet-600 underline-offset-2 hover:underline"
                >
                  Marcar todas como lidas
                </button>
              )}

              <ul className="flex flex-col gap-2">
                {inicial.map((obs) => (
                  <li key={obs.id}>
                    <CartaoObservacao
                      obs={obs}
                      lida={lidas.has(obs.id)}
                      ehAdmin={ehAdmin}
                      onLer={handleLer}
                      onArquivar={handleArquivar}
                      onRemover={handleRemover}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
