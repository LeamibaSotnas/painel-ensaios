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
        <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
        <p className="text-sm text-muted-foreground">
          Próximos ensaios agendados no cronograma.
        </p>
      </header>

      {proximosEnsaios.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum ensaio futuro cadastrado ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {proximosEnsaios.map((ensaio) => (
            <li
              key={ensaio.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium capitalize">
                  {formatarData(ensaio.data)}
                </span>
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {