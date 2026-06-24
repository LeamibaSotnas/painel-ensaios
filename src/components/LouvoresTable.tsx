"use client";

import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CirclePlay,
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
  LouvorEditavel,
  LouvorPlanilha,
  NovoLouvorInput,
} from "@/types/database.types";

export interface LouvoresTableProps {
  /** Linhas da planilha do departamento atual. */
  data: LouvorPlanilha[];
  /** id do departamento ao qual esta planilha pertence. */
  departamentoId: string;
  /** Prefixo do departamento (ex.: "MOC"), usado só para exibição. */
  codigoPrefixo: string;
  /** Quando falso, a planilha fica somente leitura (ex.: regra MUSICOS). */
  editavel?: boolean;
  /** Persiste a edição de campos de uma linha existente. */
  onAtualizarLinha: (
    id: string,
    valores: Partial<LouvorEditavel>
  ) => Promise<void>;
  /** Cria uma nova linha. O código sequencial é gerado pelo chamador. */
  onAdicionarLinha: (valores: NovoLouvorInput) => Promise<void>;
  /** Remove uma linha da planilha. */
  onRemoverLinha: (id: string) => Promise<void>;
  /** Troca a ordem_execucao entre a linha e a vizinha (cima/baixo). */
  onReordenarLinha: (id: string, direcao: "up" | "down") => Promise<void>;
}

type DraftLouvor = LouvorEditavel;

const DRAFT_VAZIO: DraftLouvor = {
  nome_louvor: "",
  cantor_banda: "",
  tonalidade: "",
  link_youtube: "",
  ordem_execucao: 0,
};

function normalizarLinkYoutube(link: string | null): string | null {
  if (!link) return null;
  const trimmed = link.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function LouvoresTable({
  data,
  departamentoId,
  codigoPrefixo,
  editavel = true,
  onAtualizarLinha,
  onAdicionarLinha,
  onRemoverLinha,
  onReordenarLinha,
}: LouvoresTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "ordem_execucao", desc: false },
  ]);
  const [editingRowId, setEditingRowId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftLouvor>(DRAFT_VAZIO);
  const [savingRowId, setSavingRowId] = React.useState<string | null>(null);
  const [isAddingRow, setIsAddingRow] = React.useState(false);
  const [newRowDraft, setNewRowDraft] = React.useState<DraftLouvor>({
    ...DRAFT_VAZIO,
    ordem_execucao: data.length + 1,
  });
  const [isSavingNewRow, setIsSavingNewRow] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  function iniciarEdicao(linha: LouvorPlanilha) {
    setErro(null);
    setEditingRowId(linha.id);
    setDraft({
      nome_louvor: linha.nome_louvor,
      cantor_banda: linha.cantor_banda,
      tonalidade: linha.tonalidade,
      link_youtube: linha.link_youtube,
      ordem_execucao: linha.ordem_execucao,
    });
  }

  function cancelarEdicao() {
    setEditingRowId(null);
    setDraft(DRAFT_VAZIO);
  }

  async function salvarEdicao(id: string) {
    setSavingRowId(id);
    setErro(null);
    try {
      await onAtualizarLinha(id, {
        nome_louvor: draft.nome_louvor.trim(),
        cantor_banda: draft.cantor_banda.trim(),
        tonalidade: draft.tonalidade.trim(),
        link_youtube: normalizarLinkYoutube(draft.link_youtube),
      });
      setEditingRowId(null);
    } catch {
      setErro("Não foi possível salvar essa linha. Tente novamente.");
    } finally {
      setSavingRowId(null);
    }
  }

  async function excluirLinha(id: string) {
    setSavingRowId(id);
    setErro(null);
    try {
      await onRemoverLinha(id);
    } catch {
      setErro("Não foi possível remover essa linha. Tente novamente.");
    } finally {
      setSavingRowId(null);
    }
  }

  async function reordenar(id: string, direcao: "up" | "down") {
    setSavingRowId(id);
    setErro(null);
    try {
      await onReordenarLinha(id, direcao);
    } catch {
      setErro("Não foi possível reordenar essa linha.");
    } finally {
      setSavingRowId(null);
    }
  }

  async function salvarNovaLinha() {
    if (!newRowDraft.nome_louvor.trim()) {
      setErro("Informe o nome do louvor antes de salvar.");
      return;
    }
    setIsSavingNewRow(true);
    setErro(null);
    try {
      await onAdicionarLinha({
        departamento_id: departamentoId,
        nome_louvor: newRowDraft.nome_louvor.trim(),
        cantor_banda: newRowDraft.cantor_banda.trim(),
        tonalidade: newRowDraft.tonalidade.trim(),
        link_youtube: normalizarLinkYoutube(newRowDraft.link_youtube),
        ordem_execucao: newRowDraft.ordem_execucao,
      });
      setIsAddingRow(false);
      setNewRowDraft({ ...DRAFT_VAZIO, ordem_execucao: data.length + 2 });
    } catch {
      setErro("Não foi possível adicionar a nova linha.");
    } finally {
      setIsSavingNewRow(false);
    }
  }

  const columns = React.useMemo<ColumnDef<LouvorPlanilha>[]>(
    () => [
      {
        accessorKey: "codigo_sequencial",
        header: "Código",
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-mono">
            {row.original.codigo_sequencial}
          </Badge>
        ),
      },
      {
        accessorKey: "nome_louvor",
        header: "Louvor",
        cell: ({ row }) => {
          const linha = row.original;
          const emEdicao = editingRowId === linha.id;
          if (!emEdicao) {
            return <span className="font-medium">{linha.nome_louvor}</span>;
          }
          return (
            <Input
              value={draft.nome_louvor}
              onChange={(e) =>
                setDraft((d) => ({ ...d, nome_louvor: e.target.value }))
              }
              placeholder="Nome do louvor"
              className="h-8"
              autoFocus
            />
          );
        },
      },
      {
        accessorKey: "cantor_banda",
        header: "Cantor/Compositor/Banda",
        cell: ({ row }) => {
          const linha = row.original;
          const emEdicao = editingRowId === linha.id;
          if (!emEdicao) {
            return (
              <span className="text-muted-foreground">
                {linha.cantor_banda || "—"}
              </span>
            );
          }
          return (
            <Input
              value={draft.cantor_banda}
              onChange={(e) =>
                setDraft((d) => ({ ...d, cantor_banda: e.target.value }))
              }
              placeholder="Cantor, compositor ou banda/grupo"
              className="h-8"
            />
          );
        },
      },
      {
        accessorKey: "tonalidade",
        header: "Tom",
        cell: ({ row }) => {
          const linha = row.original;
          const emEdicao = editingRowId === linha.id;
          if (!emEdicao) {
            return linha.tonalidade ? (
              <Badge variant="outline">{linha.tonalidade}</Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            );
          }
          return (
            <Input
              value={draft.tonalidade}
              onChange={(e) =>
                setDraft((d) => ({ ...d, tonalidade: e.target.value }))
              }
              placeholder="Ex: G, Am, C#m"
              className="h-8 w-24"
            />
          );
        },
      },
      {
        accessorKey: "link_youtube",
        header: "YouTube",
        cell: ({ row }) => {
          const linha = row.original;
          const emEdicao = editingRowId === linha.id;
          if (!emEdicao) {
            const link = normalizarLinkYoutube(linha.link_youtube);
            return (
              <Button
                variant="ghost"
                size="icon"
                disabled={!link}
                className={cn(
                  "h-8 w-8",
                  link ? "text-red-600 hover:text-red-700" : "text-muted-foreground/40"
                )}
                onClick={() => link && window.open(link, "_blank", "noopener,noreferrer")}
                title={link ?? "Sem link cadastrado"}
              >
                <CirclePlay className="h-4 w-4" />
              </Button>
            );
          }
          return (
            <Input
              value={draft.link_youtube ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, link_youtube: e.target.value }))
              }
              placeholder="https://youtube.com/..."
              className="h-8 w-44"
            />
          );
        },
      },
      {
        accessorKey: "ordem_execucao",
        header: "Ordem",
        cell: ({ row }) => {
          const linha = row.original;
          const ocupado = savingRowId === linha.id;
          return (
            <div className="flex items-center gap-1">
              <span className="w-5 text-center tabular-nums">
                {linha.ordem_execucao}
              </span>
              {editavel && (
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    disabled={ocupado}
                    onClick={() => reordenar(linha.id, "up")}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    disabled={ocupado}
                    onClick={() => reordenar(linha.id, "down")}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "acoes",
        header: "",
        cell: ({ row }) => {
          const linha = row.original;
          const emEdicao = editingRowId === linha.id;
          const salvando = savingRowId === linha.id;

          if (!editavel) return null;

          if (emEdicao) {
            return (
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                  disabled={salvando}
                  onClick={() => salvarEdicao(linha.id)}
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
            );
          }

          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => iniciarEdicao(linha)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700"
                disabled={savingRowId === linha.id}
                onClick={() => excluirLinha(linha.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [draft, editingRowId, savingRowId, editavel]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

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
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 && !isAddingRow && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum louvor cadastrado para {codigoPrefixo} ainda.
                </TableCell>
              </TableRow>
            )}

            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  editingRowId === row.original.id && "bg-muted/40"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {isAddingRow && (
              <TableRow className="bg-muted/30">
                <TableCell>
                  <Badge variant="outline" className="font-mono text-muted-foreground">
                    {codigoPrefixo}?
                  </Badge>
                </TableCell>
                <TableCell>
                  <Input
                    autoFocus
                    placeholder="Nome do louvor"
                    className="h-8"
                    value={newRowDraft.nome_louvor}
                    onChange={(e) =>
                      setNewRowDraft((d) => ({ ...d, nome_louvor: e.target.value }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Cantor, compositor ou banda/grupo"
                    className="h-8"
                    value={newRowDraft.cantor_banda}
                    onChange={(e) =>
                      setNewRowDraft((d) => ({ ...d, cantor_banda: e.target.value }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Tom"
                    className="h-8 w-24"
                    value={newRowDraft.tonalidade}
                    onChange={(e) =>
                      setNewRowDraft((d) => ({ ...d, tonalidade: e.target.value }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="https://youtube.com/..."
                    className="h-8 w-44"
                    value={newRowDraft.link_youtube ?? ""}
                    onChange={(e) =>
                      setNewRowDraft((d) => ({ ...d, link_youtube: e.target.value }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <span className="tabular-nums">{newRowDraft.ordem_execucao}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                      disabled={isSavingNewRow}
                      onClick={salvarNovaLinha}
                    >
                      {isSavingNewRow ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isSavingNewRow}
                      onClick={() => setIsAddingRow(false)}
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

      {editavel && !isAddingRow && (
        <Button
          variant="outline"
          size="sm"
          className="w-fit gap-2"
          onClick={() => {
            setIsAddingRow(true);
            setNewRowDraft({ ...DRAFT_VAZIO, ordem_execucao: data.length + 1 });
          }}
        >
          <Plus className="h-4 w-4" />
          Adicionar louvor
        </Button>
      )}
    </div>
  );
}

export default LouvoresTable;
