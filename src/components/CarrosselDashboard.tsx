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
import { cn } from "@/lib/utils";

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

/* ---------- card futurista (tema claro, compatível com o card bg-white/70) ---------- */
type Cor = "violet" | "fuchsia" | "amber" | "sky" | "emerald";

const PALETAS: Record<Cor, { card: string; icon: string; value: string }> = {
  violet: {
    card: "border-violet-200 bg-gradient-to-br from-violet-50 to-white shadow-violet-200/60",
    icon: "bg-violet-100 text-violet-600",
    value: "from-violet-600 to-fuchsia-600",
  },
  fuchsia: {
    card: "border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-white shadow-fuchsia-200/60",
    icon: "bg-fuchsia-100 text-fuchsia-600",
    value: "from-fuchsia-600 to-pink-500",
  },
  amber: {
    card: "border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-amber-200/60",
    icon: "bg-amber-100 text-amber-600",
    value: "from-amber-600 to-orange-500",
  },
  sky: {
    card: "border-sky-200 bg-gradient-to-br from-sky-50 to-white shadow-sky-200/60",
    icon: "bg-sky-100 text-sky-600",
    value: "from-sky-600 to-blue-500",
  },
  emerald: {
    card: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-emerald-200/60",
    icon: "bg-emerald-100 text-emerald-600",
    value: "from-emerald-600 to-teal-500",
  },
};

function StatCard({
  icon,
  label,
  value,
  sub,
  cor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  cor: Cor;
}) {
  const p = PALETAS[cor];
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-4 rounded-2xl border p-5 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl",
        p.card
      )}
    >
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", p.icon)}>
        {icon}
      </span>
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "mt-1 bg-gradient-to-r bg-clip-text text-3xl font-bold tracking-tight text-transparent",
            p.value
          )}
        >
          {value}
        </span>
        {sub && (
          <span className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</span>
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
      {/* indicadores */}
      <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setAtivo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === ativo
                ? "w-5 bg-violet-500"
                : "w-1.5 bg-violet-200 hover:bg-violet-300"
            )}
          />
        ))}
      </div>
    </div>
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
}: Props) {
  const proximoEnsaio = proximosEnsaios[0];
  const musicaMaisUsada = musicasMaisUsadas[0];

  const slides: React.ReactNode[] = [
    <StatCard
      key="louvores"
      icon={<Music2 className="h-5 w-5" />}
      label="Músicas cadastradas"
      value={totalLouvores}
      cor="violet"
    />,
    <StatCard
      key="ensaio"
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
            icon={<Users className="h-5 w-5" />}
            label="Usuários ativos"
            value={totalUsuarios}
            cor="fuchsia"
          />,
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* cabeçalho */}
      <header>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-violet-500" />
          <h1 className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-amber-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            Visão geral
          </h1>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Indicadores em tempo real · dados atualizados a cada carregamento
        </p>
      </header>

      {/* GRID de stats em telas maiores */}
      <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {slides.map((slide, i) => (
          <div key={i} className="h-full">{slide}</div>
        ))}
      </div>

      {/* CARROSSEL automático no mobile */}
      <div className="sm:hidden">
        <Carrossel slides={slides} />
      </div>

      {/* listas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-2xl border border-violet-100 bg-white/70 p-4 shadow-sm">
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

        <section className="flex flex-col gap-3 rounded-2xl border border-violet-100 bg-white/70 p-4 shadow-sm">
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

      {/* próximos ensaios */}
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
                className="flex flex-col gap-2 rounded-xl border border-violet-100 bg-white/70 px-4 py-3 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
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
