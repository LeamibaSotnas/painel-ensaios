import { CalendarDays, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import { listarProximosEnsaios } from "@/core/db/queries";

function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export default async function VisaoGeralPage() {
  const usuarioAtual = await getUsuarioAtual();
  const meuDepartamentoId =
    usuarioAtual?.regra === "ADMIN" ? undefined : usuarioAtual?.departamento_id ?? undefined;
  const proximosEnsaios = await listarProximosEnsaios(10, meuDepartamentoId);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-amber-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          Visão geral
        </h1>
        <p className="text-sm text-muted-foreground">
          Próximos ensaios agendados no cronograma.
        </p>
      </header>

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
    </div>
  );
}
