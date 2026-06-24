"use client";

import * as React from "react";
import {
  CalendarDays,
  Check,
  List,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  Departamento,
  EnsaioEditavel,
  EnsaioGradeComDepartamento,
} from "@/types/database.types";

export type { EnsaioEditavel, EnsaioGradeComDepartamento };

export interface EnsaioGridProps {
  data: EnsaioGradeComDepartamento[];
  departamentos: Departamento[];
  onAtualizarEnsaio: (id: string, valores: EnsaioEditavel) => Promise<void>;
  onAdicionarEnsaio: (valores: EnsaioEditavel) => Promise<void>;
  onRemoverEnsaio: (id: string) => Promise<void>;
}

const DRAFT_VAZIO = (departamentoId: string): EnsaioEditavel => ({
  data: new Date().toISOString().slice(0, 10),
  hora_inicio: "19:00",
  hora_fim: "21:00",
  departamento_id: departamentoId,
  local: "",
  responsavel: "",
  observacoes: "",
});

function formatarDataExibicao(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function SeletorDepartamento({
  value,
  onChange,
  departamentos,
}: {
  value: string;
  onChange: (id: string) => void;
  departamentos: Departamento[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-36 rounded-md border border-input bg-background px-2 text-sm"
    >
      {departamentos.map((dep) => (
        <option key={dep.id} value={dep.id}>
          {dep.nome}
        </option>
      ))}
    </select>
  );
}

function CamposExtras({
  draft,
  onChange,
}: {
  draft: EnsaioEditavel;
  onChange: (valores: Partial<EnsaioEditavel>) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <Input
        placeholder="Local"
        className="h-8"
        value={draft.local}
        onChange={(e) => onChange({ local: e.target.value })}
      />
      <Input
        placeholder="Responsável"
        className="h-8"
        value={draft.responsavel}
        onChange={(e) => onChange({ responsavel: e.target.value })}
      />
      <textarea
        placeholder="Observações"
        className="min-h-8 resize-none rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        rows={1}
        value={draft.observacoes}
        onChange={(e) => onChange({ observacoes: e.target.value })}
      />
    </div>
  );
}

/** Agrupa os ensaios por dia (YYYY-MM-DD) do mês exibido, para a visão em calendário. */
function useDiasDoMes(referencia: Date) {
  return React.useMemo(() => {
    const ano = referencia.getFullYear();
    const mes = referencia.getMonth();
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();

    const celulas: { data: string | null }[] = [];
    for (let i = 0; i < primeiroDiaSemana; i += 1) {
      celulas.push({ data: null });
    }
    for (let dia = 1; dia <= totalDias; dia += 1) {
      const iso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      celulas.push({ data: iso });
    }
    return celulas;
  }, [referencia]);
}

function VisaoCalendario({ data }: { data: EnsaioGradeComDepartamento[] }) {
  const [mesAtual, setMesAtual] = React.useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });
  const celulas = useDiasDoMes(mesAtual);

  const ensaiosPorDia = React.useMemo(() => {
    const mapa = new Map<string, EnsaioGradeComDepartamento[]>();
    for (const ensaio of data) {
      const lista = mapa.get(ensaio.data) ?? [];
      lista.push(ensaio);
      mapa.set(ensaio.data, lista);
    }
    return mapa;
  }, [data]);

  const nomeMes = mesAtual.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium capitalize">{nomeMes}</span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setMesAtual((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
            }
          >
            ‹
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setMesAtual((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
            }
          >
            ›
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
          <span key={dia}>{dia}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {celulas.map((celula, index) => {
          if (!celula.data) {
            return <div key={`vazio-${index}`} className="min-h-20 rounded-md" />;
          }
          const ensaiosDoDia = ensaiosPorDia.get(celula.data) ?? [];
          const dia = Number(celula.data.slice(-2));
          return (
            <div
              key={celula.data}
              className="min-h-20 rounded-md border bg-muted/20 p-1 text-xs"
            >
              <span className="text-muted-foreground">{dia}</span>
              <div className="mt-1 flex flex-col gap-0.5">
                {ensaiosDoDia.map((ensaio) => (
                  <span
                    key={ensaio.id}
                    className="truncate rounded bg-primary/10 px-1 py-0.5 text-primary"
                    title={`${ensaio.departamento_nome} · ${ensaio.hora_inicio.slice(0, 5)}`}
                  >
                    {ensaio.hora_inicio.slice(0, 5)} {ensaio.departamento_nome}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EnsaioGrid({
  data,
  departamentos,
  onAtualizarEnsaio,
  onAdicionarEnsaio,
  onRemoverEnsaio,
}: EnsaioGridProps) {
  const [visao, setVisao] = React.useState<"lista" | "calendario">("lista");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<EnsaioEditavel>(
    DRAFT_VAZIO(departamentos[0]?.id ?? "")
  );
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);
  const [novoDraft, setNovoDraft] = React.useState<EnsaioEditavel>(
    DRAFT_VAZIO(departamentos[0]?.id ?? "")
  );
  const [isSavingNovo, setIsSavingNovo] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  function iniciarEdicao(ensaio: EnsaioGradeComDepartamento) {
    setErro(null);
    setEditingId(ensaio.id);
    setDraft({
      data: ensaio.data,
      hora_inicio: ensaio.hora_inicio,
      hora_fim: ensaio.hora_fim,
      departamento_id: ensaio.departamento_id,
      local: ensaio.local,
      responsavel: ensaio.responsavel,
      observacoes: ensaio.observacoes,
    });
  }

  function cancelarEdicao() {
    setEditingId(null);
  }

  async function salvarEdicao(id: string) {
    setSavingId(id);
    setErro(null);
    try {
      await onAtualizarEnsaio(id, draft);
      setEditingId(null);
    } catch {
      setErro("Não foi possível salvar esse ensaio.");
    } finally {
      setSavingId(null);
    }
  }

  async function remover(id: string) {
    setSavingId(id);
    setErro(null);
    try {
      await onRemoverEnsaio(id);
    } catch {
      setErro("Não foi possível remover esse ensaio.");
    } finally {
      setSavingId(null);
    }
  }

  async function salvarNovo() {
    setIsSavingNovo(true);
    setErro(null);
    try {
      await onAdicionarEnsaio(novoDraft);
      setIsAdding(false);
      setNovoDraft(DRAFT_VAZIO(departamentos[0]?.id ?? ""));
    } catch {
      setErro("Não foi possível adicionar o ensaio.");
    } finally {
      setIsSavingNovo(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        {erro && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}
        <div className="ml-auto flex gap-1 rounded-md border bg-muted/30 p-1">
          <Button
            variant={visao === "lista" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5"
            onClick={() => setVisao("lista")}
          >
            <List className="h-3.5 w-3.5" />
            Lista
          </Button>
          <Button
            variant={visao === "calendario" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5"
            onClick={() => setVisao("calendario")}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Calendário
          </Button>
        </div>
      </div>

      {visao === "calendario" ? (
        <VisaoCalendario data={data} />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-36">Data</TableHead>
                <TableHead className="w-24">Início</TableHead>
                <TableHead className="w-24">Fim</TableHead>
                <TableHead className="w-36">Departamento</TableHead>
                <TableHead>Local / Responsável / Observações</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 && !isAdding && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Nenhum ensaio agendado ainda.
                  </TableCell>
                </TableRow>
              )}

              {data.map((ensaio) => {
                const emEdicao = editingId === ensaio.id;
                const salvando = savingId === ensaio.id;

                return (
                  <TableRow key={ensaio.id} className={cn(emEdicao && "bg-muted/40")}>
                    <TableCell>
                      {emEdicao ? (
                        <Input
                          type="date"
                          className="h-8 w-36"
                          value={draft.data}
                          onChange={(e) => setDraft((d) => ({ ...d, data: e.target.value }))}
                        />
                      ) : (
                        <span className="capitalize">{formatarDataExibicao(ensaio.data)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {emEdicao ? (
                        <Input
                          type="time"
                          className="h-8 w-24"
                          value={draft.hora_inicio}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, hora_inicio: e.target.value }))
                          }
                        />
                      ) : (
                        ensaio.hora_inicio.slice(0, 5)
                      )}
                    </TableCell>
                    <TableCell>
                      {emEdicao ? (
                        <Input
                          type="time"
                          className="h-8 w-24"
                          value={draft.hora_fim}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, hora_fim: e.target.value }))
                          }
                        />
                      ) : (
                        ensaio.hora_fim.slice(0, 5)
                      )}
                    </TableCell>
                    <TableCell>
                      {emEdicao ? (
                        <SeletorDepartamento
                          value={draft.departamento_id}
                          onChange={(id) => setDraft((d) => ({ ...d, departamento_id: id }))}
                          departamentos={departamentos}
                        />
                      ) : (
                        <Badge variant="outline">{ensaio.departamento_nome}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {emEdicao ? (
                        <CamposExtras
                          draft={draft}
                          onChange={(valores) => setDraft((d) => ({ ...d, ...valores }))}
                        />
                      ) : (
                        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                          {(ensaio.local || ensaio.responsavel) && (
                            <span>
                              {[ensaio.local, ensaio.responsavel].filter(Boolean).join(" · ")}
                            </span>
                          )}
                          {ensaio.observacoes && <span>{ensaio.observacoes}</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {emEdicao ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                            disabled={salvando}
                            onClick={() => salvarEdicao(ensaio.id)}
                          >
                            {salvando ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={salvando}
                            onClick={cancelarEdicao}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => iniciarEdicao(ensaio)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            disabled={salvando}
                            onClick={() => remover(ensaio.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {isAdding && (
                <TableRow className="bg-muted/30">
                  <TableCell>
                    <Input
                      type="date"
                      className="h-8 w-36"
                      value={novoDraft.data}
                      onChange={(e) => setNovoDraft((d) => ({ ...d, data: e.target.value }))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      className="h-8 w-24"
                      value={novoDraft.hora_inicio}
                      onChange={(e) =>
                        setNovoDraft((d) => ({ ...d, hora_inicio: e.target.value }))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      className="h-8 w-24"
                      value={novoDraft.hora_fim}
                      onChange={(e) =>
                        setNovoDraft((d) => ({ ...d, hora_fim: e.target.value }))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <SeletorDepartamento
                      value={novoDraft.departamento_id}
                      onChange={(id) => setNovoDraft((d) => ({ ...d, departamento_id: id }))}
                      departamentos={departamentos}
                    />
                  </TableCell>
                  <TableCell>
                    <CamposExtras
                      draft={novoDraft}
                      onChange={(valores) => setNovoDraft((d) => ({ ...d, ...valores }))}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                        disabled={isSavingNovo}
                        onClick={salvarNovo}
                      >
                        {isSavingNovo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isSavingNovo}
                        onClick={() => setIsAdding(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {visao === "lista" && !isAdding && (
        <Button
          variant="outline"
          size="sm"
          className="w-fit gap-2"
          onClick={() => {
            setIsAdding(true);
            setNovoDraft(DRAFT_VAZIO(departamentos[0]?.id ?? ""));
          }}
        >
          <Plus className="h-4 w-4" />
          Agendar ensaio
        </Button>
      )}
    </div>
  );
}

export default EnsaioGrid;
