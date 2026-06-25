import { CalendarDays, Clock, History, Music2, TrendingUp, Users } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import {
  contarLouvores,
  contarUsuarios,
  listarMusicasMaisUsadas,
  listarProximosEnsaios,
  listarUltimasAlteracoes,
} from "@/core/db/queries";

function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

/** Formata o timestamp `atualizado_em` (texto vindo do Postgres) com tolerância a formato. */
function formatarDataHora(timestamp: string): string {
  const data = new Date(timestamp.replace(" ", "T"));
  if (Number.isNaN(data.getTime())) return timestamp.slice(0, 16);
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CardEstatistica({
  icone,
  titulo,
  valor,
  subtitulo,
}: {
  icone: ReactNode;
  titulo: string;
  valor: string | number;
  subtitulo?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-white/70 p-4 shadow-sm transition-shadow hover:shadow-md">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600">
        {icone}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs text-muted-foreground">{titulo}</span>
        <span className="truncate text-base font-semibold">{valor}</span>
        {subtitulo && <span className="truncate text-xs text-muted-foreground">{subtitulo}</span>}
      </div>
    </div>
  );
}

export default async function VisaoGeralPage() {
  const usuarioAtual = await getUsuarioAtual();
  const ehAdmin = usuarioAtual?.regra === "ADMIN";
  const meuDepartamentoId = ehAdmin ? undefined : usuarioAtual?.departamento_id ?? undefined;

  const [proximosEnsaios, totalLouvores, musicasMaisUsadas, ultimasAlteracoes, totalUsuarios] =
    await Promise.all([
      listarProximosEnsaios(10, meuDepartamentoId),
      contarLouvores(meuDepartamentoId),
      listarMusicasMaisUsadas(5, meuDepartamentoId),
      listarUltimasAlteracoes(5, meuDepartamentoId),
      ehAdmin ? contarUsuarios() : Promise.resolve(0),
    ]);

  const proximoEnsaio = proximosEnsaios[0];
  const musicaMaisUsada = musicasMaisUsadas[0];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-amber-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          Visão geral
        </h1>
        <p className="text-sm text-muted-foreground">
          Indicadores rápidos e próximos ensaios agendados no cronograma.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CardEstatistica
          icone={<Music2 className="h-4 w-4" />}
          titulo="Músicas cadastradas"
          valor={totalLouvores}
        />
        {ehAdmin && (
          <CardEstatistica
            icone={<Users className="h-4 w-4" />}
            titulo="Usuários ativos"
            valor={totalUsuarios}
          />
        )}
        <CardEstatistica
          icone={<CalendarDays className="h-4 w-4" />}
          titulo="Próximo ensaio"
          valor={proximoEnsaio ? formatarData(proximoEnsaio.data) : "—"}
          subtitulo={
            proximoEnsaio
              ? `${proximoEnsaio.hora_inicio.slice(0, 5)} · ${proximoEnsaio.departamento_nome}`
              : "Nenhum agendado"
          }
        />
        <CardEstatistica
          icone={<TrendingUp className="h-4 w-4" />}
          titulo="Mais executada"
          valor={musicaMaisUsada ? musicaMaisUsada.nome_louvor : "—"}
          subtitulo={
            musicaMaisUsada
              ? `${musicaMaisUsada.vezes_executado}x · ${musicaMaisUsada.departamento_nome}`
              : "Sem execuções ainda"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-2 rounded-2xl border border-violet-100 bg-white/70 p-4 shadow-sm">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-violet-600" /> Músicas mais usadas
          </h2>
          {musicasMaisUsadas.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma execução registrada ainda.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {musicasMaisUsadas.map((musica) => (
                <li key={musica.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">
                    {musica.nome_louvor}
                    {musica.cantor_banda && (
                      <span className="text-muted-foreground"> — {musica.cantor_banda}</span>
                    )}
                  </span>
                  <Badge variant="secondary" className="shrink-0">
                    {musica.vezes_executado}x
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2 rounded-2xl border border-violet-100 bg-white/70 p-4 shadow-sm">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <History className="h-4 w-4 text-violet-600" /> Últimas alterações
          </h2>
          {ultimasAlteracoes.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma alteração registrada ainda.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {ultimasAlteracoes.map((alteracao) => (
                <li
                  key={alteracao.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate">{alteracao.nome_louvor}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatarDataHora(alteracao.atualizado_em)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Próximos ensaios</h2>
        {proximosEnsaios.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-8 text-center text-sm text-muted-foreground">
            Nenhum ensaio futuro cadastrado ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {proximosEnsaios.map((ensaio) => (
              <li
                key={ensaio.id}
                className="flex flex-col gap-3 rounded-2xl border border-violet-100 bg-white/70 p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium capitalize">
                    {formatarData(ensaio.data)}
                  </span>
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {ensaio.hora_inicio.slice(0, 5)} – {ensaio.hora_fim.slice(0, 5)}
                  </span>
                </div>
                <Badge variant="secondary" className="w-fit">{ensaio.departamento_nome}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
