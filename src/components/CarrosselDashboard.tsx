"use client";

import * as React from "react";
import {
  CalendarDays,
  Clock,
  History,
  Music2,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MorphBackground } from "@/components/MorphBackground";
import { cn } from "@/lib/utils";
import type {
  CategoriaObservacao,
  ObservacaoMural,
  PrioridadeObservacao,
} from "@/types/database.types";

/* ---------- tipos ---------- */
export interface EnsaioResumo {
  id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  departamento_nome: string;
}

export interface MusicaResumo {
  id: string;
  nome_louvor: string;
  cantor_banda: string | null;
  vezes_executado: number;
  departamento_nome: string;
}

export interface AlteracaoResumo {
  id: string;
  nome_louvor: string;
  atualizado_em: string;
}

interface Props {
  totalLouvores: number;
  totalUsuarios: number;
  ehAdmin: boolean;
  proximosEnsaios: EnsaioResumo[];
  musicasMaisUsadas: MusicaResumo[];
  ultimasAlteracoes: AlteracaoResumo[];
  observacoes?: ObservacaoMural[];
  onCriarObservacao?: (dados: {
    titulo: string;
    descricao: string;
    prioridade: PrioridadeObservacao;
    categoria: CategoriaObservacao;
    departamentoId: string | null;
  }) => Promise<void>;
  onArquivarObservacao?: (id: string) => Promise<void>;
  onRemoverObservacao?: (id: string) => Promise<void>;
  autorNome?: string;
  autorId?: string;
  departamentoIdUsuario?: string | null;
}

/* ---------- helpers ---------- */
function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatarDataHora(ts: string): string {
  const d = new Date(ts.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return ts.slice(0, 16);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ---------- counter animado ---------- */
function AnimatedNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = React.useState(0);
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        let start = 0;
        const end = value;
        if (end === 0) { setDisplayed(0); return; }
        const duration = 900;
        const step = (ts: number, startTs: number) => {
          const progress = Math.min((ts - startTs) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplayed(Math.round(eased * end));
          if (progress < 1) requestAnimationFrame((t) => step(t, startTs));
        };
        requestAnimationFrame((ts) => step(ts, ts));
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{displayed}</span>;
}

/* ---------- card de estatística premium ---------- */
type Cor = "violet" | "fuchsia" | "amber" | "sky" | "emerald";

const PALETAS: Record<Cor, { card: string; glow: string; icon: string; accent: string }> = {
  violet: {
    card: "border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-slate-50",
    glow: "shadow-violet-300/40",
    icon: "bg-violet-100 text-violet-600",
    accent: "from-violet-600 to-fuchsia-600",
  },
  fuchsia: {
    card: "border-fuchsia-200/70 bg-gradient-to-br from-fuchsia-50 via-white to-slate-50",
    glow: "shadow-fuchsia-300/40",
    icon: "bg-fuchsia-100 text-fuchsia-600",
    accent: "from-fuchsia-600 to-pink-500",
  },
  amber: {
    card: "border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-slate-50",
    glow: "shadow-amber-300/40",
    icon: "bg-amber-100 text-amber-600",
    accent: "from-amber-600 to-orange-500",
  },
  sky: {
    card: "border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-slate-50",
    glow: "shadow-sky-300/40",
    icon: "bg-sky-100 text-sky-600",
    accent: "from-sky-600 to-blue-500",
  },
  emerald: {
    card: "border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-slate-50",
    glow: "shadow-emerald-300/40",
    icon: "bg-emerald-100 text-emerald-600",
    accent: "from-emerald-600 to-teal-500",
  },
};

/** RGB sem alpha — usado nas luzes de canto animadas */
const CORNER_RGB: Record<Cor, string> = {
  violet:  "139,92,246",
  fuchsia: "217,70,239",
  amber:   "245,158,11",
  sky:     "14,165,233",
  emerald: "16,185,129",
};

/** Cor do anel pulsante do ícone */
const RING_COLOR: Record<Cor, string> = {
  violet:  "rgba(139,92,246,0.50)",
  fuchsia: "rgba(217,70,239,0.50)",
  amber:   "rgba(245,158,11,0.50)",
  sky:     "rgba(14,165,233,0.50)",
  emerald: "rgba(16,185,129,0.50)",
};

function StatCard({
  icon,
  label,
  value,
  sub,
  cor,
  isNumeric = false,
  index = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  cor: Cor;
  isNumeric?: boolean;
  index?: number;
}) {
  const p   = PALETAS[cor];
  const rgb = CORNER_RGB[cor];
  const ring = RING_COLOR[cor];

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border p-5",
        "shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl",
        p.card,
        p.glow
      )}
      style={{ animation: `card-enter 0.45s ease-out ${index * 90}ms backwards` }}
    >
      {/* ── Luz de canto superior direito (animada) */}
      <div
        className="pointer-events-none absolute -right-5 -top-5 h-28 w-28 rounded-full blur-2xl"
        style={{
          background: `radial-gradient(circle, rgba(${rgb},0.50), transparent 68%)`,
          animation: `corner-shimmer 3.2s ease-in-out ${index * 0.55}s infinite`,
        }}
      />
      {/* ── Luz de canto inferior esquerdo */}
      <div
        className="pointer-events-none absolute -bottom-5 -left-5 h-20 w-20 rounded-full blur-xl"
        style={{
          background: `radial-gradient(circle, rgba(${rgb},0.28), transparent 68%)`,
          animation: `corner-shimmer 3.2s ease-in-out ${1.6 + index * 0.55}s infinite`,
        }}
      />
      {/* ── Sweep de luz no hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(108deg, transparent 30%, rgba(${rgb},0.09) 50%, transparent 70%)`,
        }}
      />

      {/* Ícone com anel pulsante */}
      <div
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-xl",
          "transition-all duration-300 group-hover:scale-110",
          p.icon
        )}
        style={
          {
            "--ring-color": ring,
            animation: `icon-pulse-ring 2.8s ease-in-out ${index * 0.7}s infinite`,
          } as React.CSSProperties
        }
      >
        {icon}
      </div>

      <div className="relative flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "mt-1 bg-gradient-to-r bg-clip-text text-3xl font-black tracking-tight text-transparent",
            p.accent
          )}
        >
          {isNumeric && typeof value === "number" ? (
            <AnimatedNumber value={value} />
          ) : (
            value
          )}
        </span>
        {sub && (
          <span className="mt-1 truncate text-xs font-medium text-muted-foreground">{sub}</span>
        )}
      </div>
    </div>
  );
}

/* ---------- carrossel automático (mobile) ---------- */
function Carrossel({ slides }: { slides: React.ReactNode[] }) {
  const [ativo, setAtivo] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setAtivo((a) => (a + 1) % slides.length), 3600);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div className="relative select-none overflow-hidden rounded-2xl">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${ativo * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="min-w-full pb-5">
            {slide}
          </div>
        ))}
      </div>
      <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setAtivo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === ativo
                ? "w-6 bg-gradient-to-r from-sky-400 to-cyan-400 shadow-sm shadow-sky-400/60"
                : "w-1.5 bg-sky-200/30 hover:bg-sky-200/60"
            )}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- badge de notificação mural (importado dinamicamente para evitar SSR issues) ---------- */
function MuralInline({
  observacoes,
  ehAdmin,
  autorNome,
  autorId,
  departamentoId,
  onCriar,
  onArquivar,
  onRemover,
}: {
  observacoes: ObservacaoMural[];
  ehAdmin: boolean;
  autorNome: string;
  autorId: string;
  departamentoId: string | null;
  onCriar?: Props["onCriarObservacao"];
  onArquivar?: Props["onArquivarObservacao"];
  onRemover?: Props["onRemoverObservacao"];
}) {
  // Import dinâmico para evitar que o componente pesado seja incluído no SSR bundle
  const [Mural, setMural] = React.useState<React.ComponentType<
    React.ComponentProps<typeof import("@/components/MuralObservacoes").MuralObservacoes>
  > | null>(null);

  React.useEffect(() => {
    import("@/components/MuralObservacoes").then((m) => setMural(() => m.MuralObservacoes));
  }, []);

  if (!Mural || !onCriar || !onArquivar || !onRemover) return null;

  return (
    <Mural
      observacoes={observacoes}
      ehAdmin={ehAdmin}
      autorNome={autorNome}
      autorId={autorId}
      departamentoId={departamentoId}
      onCriar={onCriar}
      onArquivar={onArquivar}
      onRemover={onRemover}
    />
  );
}

/* ---------- componente exportado ---------- */
export function CarrosselDashboard({
  totalLouvores,
  totalUsuarios,
  ehAdmin,
  proximosEnsaios,
  musicasMaisUsadas,
  ultimasAlteracoes,
  observacoes = [],
  onCriarObservacao,
  onArquivarObservacao,
  onRemoverObservacao,
  autorNome = "",
  autorId = "",
  departamentoIdUsuario = null,
}: Props) {
  const proximoEnsaio = proximosEnsaios[0];
  const musicaMaisUsada = musicasMaisUsadas[0];

  const slides: React.ReactNode[] = [
    <StatCard
      key="louvores"
      index={0}
      icon={<Music2 className="h-5 w-5" />}
      label="Músicas cadastradas"
      value={totalLouvores}
      cor="violet"
      isNumeric
    />,
    <StatCard
      key="ensaio"
      index={1}
      icon={<CalendarDays className="h-5 w-5" />}
      label="Próximo ensaio"
      value={proximoEnsaio ? formatarData(proximoEnsaio.data) : "—"}
      sub={
        proximoEnsaio
          ? `${proximoEnsaio.hora_inicio.slice(0, 5)} · ${proximoEnsaio.departamento_nome}`
          : "Nenhum agendado"
      }
      cor="sky"
    />,
    <StatCard
      key="mais-usada"
      index={2}
      icon={<TrendingUp className="h-5 w-5" />}
      label="Mais executada"
      value={musicaMaisUsada ? musicaMaisUsada.nome_louvor : "—"}
      sub={
        musicaMaisUsada
          ? `${musicaMaisUsada.vezes_executado}× · ${musicaMaisUsada.departamento_nome}`
          : "Sem execuções ainda"
      }
      cor="emerald"
    />,
    ...(ehAdmin
      ? [
          <StatCard
            key="usuarios"
            index={3}
            icon={<Users className="h-5 w-5" />}
            label="Usuários ativos"
            value={totalUsuarios}
            cor="fuchsia"
            isNumeric
          />,
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── HERO — cabeçalho com morph background ── */}
      <header className="relative overflow-hidden rounded-2xl border border-white/35 bg-white/22 px-6 py-5 shadow-md backdrop-blur-xl"
              style={{ boxShadow: "0 4px 30px -6px rgba(99,102,241,0.20), inset 0 1px 0 rgba(255,255,255,0.35)" }}>
        <MorphBackground />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-md shadow-violet-500/35">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <h1 className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-amber-500 bg-clip-text text-2xl font-black tracking-tight text-transparent">
              Visão geral
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Painel executivo · dados atualizados a cada carregamento
          </p>
        </div>
      </header>

      {/* ── GRID de stats em telas maiores ── */}
      <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {slides.map((slide, i) => (
          <div key={i} className="h-full">
            {slide}
          </div>
        ))}
      </div>

      {/* ── CARROSSEL automático no mobile ── */}
      <div className="sm:hidden">
        <Carrossel slides={slides} />
      </div>

      {/* ── MURAL DE OBSERVAÇÕES ── */}
      <div className="rounded-2xl border border-violet-200/50 bg-white/60 p-4 shadow-md backdrop-blur-sm"
           style={{ boxShadow: "0 4px 20px -6px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.6)" }}>
        <MuralInline
          observacoes={observacoes}
          ehAdmin={ehAdmin}
          autorNome={autorNome}
          autorId={autorId}
          departamentoId={departamentoIdUsuario}
          onCriar={onCriarObservacao}
          onArquivar={onArquivarObservacao}
          onRemover={onRemoverObservacao}
        />
      </div>

      {/* ── LISTAS ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Músicas mais usadas */}
        <section className="group flex flex-col gap-3 rounded-2xl border border-amber-100/70 bg-white/65 p-4 shadow-md backdrop-blur-sm transition-all duration-300 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/40"
                 style={{ boxShadow: "0 4px 20px -6px rgba(245,158,11,0.12), inset 0 1px 0 rgba(255,255,255,0.55)" }}>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Star className="h-4 w-4 text-amber-500" />
            Músicas mais usadas
          </h2>
          {musicasMaisUsadas.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma execução registrada ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {musicasMaisUsadas.map((m, i) => (
                <li key={m.id} className="flex items-center gap-3 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-600">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {m.nome_louvor}
                    {m.cantor_banda && (
                      <span className="text-muted-foreground"> — {m.cantor_banda}</span>
                    )}
                  </span>
                  <Badge variant="secondary" className="shrink-0">
                    {m.vezes_executado}×
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Últimas alterações */}
        <section className="group flex flex-col gap-3 rounded-2xl border border-violet-100/70 bg-white/65 p-4 shadow-md backdrop-blur-sm transition-all duration-300 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/40"
                 style={{ boxShadow: "0 4px 20px -6px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.55)" }}>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <History className="h-4 w-4 text-violet-600" />
            Últimas alterações
          </h2>
          {ultimasAlteracoes.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma alteração registrada ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {ultimasAlteracoes.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{a.nome_louvor}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatarDataHora(a.atualizado_em)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── PRÓXIMOS ENSAIOS ── */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <CalendarDays className="h-4 w-4 text-sky-600" />
          Próximos ensaios
        </h2>
        {proximosEnsaios.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-8 text-center text-sm text-muted-foreground">
            Nenhum ensaio futuro cadastrado ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {proximosEnsaios.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-2 rounded-xl border border-sky-100/60 bg-white/60 px-4 py-3 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <CalendarDays className="h-4 w-4 shrink-0 text-sky-500" />
                  <span className="font-medium capitalize">{formatarData(e.data)}</span>
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {e.hora_inicio.slice(0, 5)} – {e.hora_fim.slice(0, 5)}
                  </span>
                </div>
                <Badge variant="secondary" className="w-fit">
                  {e.departamento_nome}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
