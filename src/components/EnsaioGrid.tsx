"use client";

import * as React from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

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
import type { Departamento, EnsaioGrade } from "@/types/database.types";

export interface EnsaioGradeComDepartamento extends EnsaioGrade {
  departamento: Pick<Departamento, "nome" | "slug"> | null;
}

export type EnsaioEditavel = Pick<
  EnsaioGrade,
  "data" | "hora_inicio" | "hora_fim" | "departamento_id"
>;

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
      className="h-8 w-40 rounded-md border border-input bg-background px-2 text-sm"
    >
      {departamentos.map((dep) => (
        <option key={dep.id} value={dep.id}>
          {dep.nome}
        </option>
      ))}
    </select>
  );
}

export function EnsaioGrid({
  data,
  departamentos,
  onAtualizarEnsaio,
  onAdicionarEnsaio,
  onRemoverEnsaio,
}: EnsaioGridProps) {
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
      {erro && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && !isAdding && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
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
                        className="h-8 w-28"
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
                        className="h-8 w-28"
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
                      ensaio.departamento && (
                        <Badge variant="outline">{ensaio.departamento.nome}</Badge>
                      )
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
                    className="h-8 w-28"
                    value={novoDraft.hora_inicio}
                    onChange={(e) =>
                      setNovoDraft((d) => ({ ...d, hora_inicio: e.target.value }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="time"
                    className="h-8 w-28"
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

      {!isAdding && (
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
