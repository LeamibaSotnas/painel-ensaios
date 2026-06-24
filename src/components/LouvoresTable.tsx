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
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  Music2,
  Pencil,
  Plus,
  Search,
  Star,
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
  LouvorDetalhesEditavel,
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
  onAtualizarLinha: (id: string, valores: LouvorEditavel) => Promise<void>;
  /** Cria uma nova linha. O código sequencial é gerado pelo chamador. */
  onAdicionarLinha: (valores: NovoLouvorInput) => Promise<void>;
  /** Remove uma linha da planilha. */
  onRemoverLinha: (id: string) => Promise<void>;
  /** Troca a ordem_execucao entre a linha e a vizinha (cima/baixo). */
  onReordenarLinha: (id: string, direcao: "up" | "down") => Promise<void>;
  /** Marca/desmarca um louvor como favorito. */
  onAlternarFavorito: (id: string, favorito: boolean) => Promise<void>;
  /** Registra a data de hoje como última execução do louvor. */
  onMarcarExecutado: (id: string) => Promise<void>;
  /** Salva cifra/observações (painel expansível por linha). */
  onAtualizarDetalhes: (id: string, valores: LouvorDetalhesEditavel) => Promise<void>;
  /** Busca título + miniatura de um link do YouTube (oEmbed, sem download). */
  onBuscarMetadadosYoutube: (
    url: string
  ) => Promise<{ titulo: string; thumbnail: string } | null>;
}

type DraftLouvor = LouvorEditavel;

const DRAFT_VAZIO: DraftLouvor = {
  nome_louvor: "",
  cantor_banda: "",
  tonalidade: "",
  link_youtube: "",
  youtube_titulo: null,
  youtube_thumbnail: null,
  ordem_execucao: 0,
};

function normalizarLinkYoutube(link: string | null): string | null {
  if (!link) return null;
  const trimmed = link.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function formatarDataCurta(data: string | null): string {
  if (!data) return "—";
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
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
  onAlternarFavorito,
  onMarcarExecutado,
  onAtualizarDetalhes,
  onBuscarMetadadosYoutube,
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
  const [buscandoMetadados, setBuscandoMetadados] = React.useState(false);

  // --- filtros ---------------------------------------------------------
  const [busca, setBusca] = React.useState("");
  const [filtroTom, setFiltroTom] = React.useState("");
  const [somenteFavoritos, setSomenteFavoritos] = React.useState(false);

  // --- painel expansível (cifra/observações) ----------------------------
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [detalhesDraft, setDetalhesDraft] = React.useState<LouvorDetalhesEditavel>({
    cifra: "",
    observacoes: "",
  });
  const [savingDetalhes, setSavingDetalhes] = React.useState(false);

  const tonsDisponiveis = React.useMemo(() => {
    const tons = new Set<string>();
    for (const linha of data) {
      if (linha.tonalidade) tons.add(linha.tonalidade);
    }
    return Array.from(tons).sort();
  }, [data]);

  const dadosFiltrados = React.useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return data.filter((linha) => {
      if (somenteFavoritos && !linha.favorito) return false;
      if (filtroTom && linha.tonalidade !== filtroTom) return false;
      if (termo) {
        const alvo = `${linha.nome_louvor} ${linha.cantor_banda}`.toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      return true;
    });
  }, [data, busca, filtroTom, somenteFavoritos]);

  function iniciarEdicao(linha: LouvorPlanilha) {
    setErro(null);
    setEditingRowId(linha.id);
    setDraft({
      nome_louvor: linha.nome_louvor,
      cantor_banda: linha.cantor_banda,
      tonalidade: linha.tonalidade,
      link_youtube: linha.link_youtube,
      youtube_titulo: linha.youtube_titulo,
      youtube_thumbnail: linha.youtube_thumbnail,
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
        youtube_titulo: draft.youtube_titulo,
        youtube_thumbnail: draft.youtube_thumbnail,
        ordem_execucao: draft.ordem_execucao,
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

  async function alternarFavorito(linha: LouvorPlanilha) {
    setErro(null);
    try {
      await onAlternarFavorito(linha.id, !linha.favorito);
    } catch {
      setErro("Não foi possível atualizar o favorito.");
    }
  }

  async function marcarExecutado(id: string) {
    setSavingRowId(id);
    setErro(null);
    try {
      await onMarcarExecutado(id);
    } catch {
      setErro("Não foi possível registrar a execução.");
    } finally {
      setSavingRowId(null);
    }
  }

  function alternarExpandido(linha: LouvorPlanilha) {
    if (expandedId === linha.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(linha.id);
    setDetalhesDraft({ cifra: linha.cifra, observacoes: linha.observacoes });
  }

  async function salvarDetalhes(id: string) {
    setSavingDetalhes(true);
    setErro(null);
    try {
      await onAtualizarDetalhes(id, detalhesDraft);
    } catch {
      setErro("Não foi possível salvar a cifra/observações.");
    } finally {
      setSavingDetalhes(false);
    }
  }

  async function buscarMetadados(link: string, aplicar: (m: { titulo: string; thumbnail: string }) => void) {
    const linkNormalizado = normalizarLinkYoutube(link);
    if (!linkNormalizado) return;
    setBuscandoMetadados(true);
    try {
      const metadados = await onBuscarMetadadosYoutube(linkNormalizado);
      if (metadados) aplicar(metadados);
    } catch {
      // captura de metadados é apenas um complemento — falha silenciosa
    } finally {
      setBuscandoMetadados(false);
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
        youtube_titulo: newRowDraft.youtube_titulo,
        youtube_thumbnail: newRowDraft.youtube_thumbnail,
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

  function CartaoYoutube({ linha }: { linha: LouvorPlanilha }) {
    const link = normalizarLinkYoutube(linha.link_youtube);
    if (!link) {
      return <span className="text-xs text-muted-foreground/60">Sem link</span>;
    }
    if (!linha.youtube_thumbnail) {
      return (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
        >
          <Music2 className="h-3.5 w-3.5" />
          Abrir no YouTube
        </a>
      );
    }
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2 rounded-md"
        title={linha.youtube_titulo ?? "Abrir no YouTube"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={linha.youtube_thumbnail}
          alt=""
          className="h-9 w-16 rounded-sm object-cover"
        />
        <span className="flex max-w-32 flex-col">
          <span className="truncate text-xs font-medium group-hover:underline">
            {linha.youtube_titulo || "Vídeo"}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            Abrir <ExternalLink className="h-2.5 w-2.5" />
          </span>
        </span>
      </a>
    );
  }

  const columns = React.useMemo<ColumnDef<LouvorPlanilha>[]>(
    () => [
      {
        id: "favorito",
        header: "",
        cell: ({ row }) => {
          const linha = row.original;
          return (
            <button
              type="button"
              onClick={() => alternarFavorito(linha)}
              className="text-muted-foreground/50 transition-colors hover:text-amber-500"
              title={linha.favorito ? "Remover dos favoritos" : "Marcar como favorito"}
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  linha.favorito && "fill-amber-400 text-amber-500"
                )}
              />
            </button>
          );
        },
      },
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
          const expandido = expandedId === linha.id;
          if (!emEdicao) {
            return (
              <button
                type="button"
                onClick={() => alternarExpandido(linha)}
                className="flex items-center gap-1.5 text-left font-medium hover:underline"
              >
                {expandido ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                {linha.nome_louvor}
              </button>
            );
          }
          return (
            <Input
              value={draft.nome_louvor}
              onChange={(e) => setDraft((d) => ({ ...d, nome_louvor: e.target.value }))}
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
              <span className="text-muted-foreground">{linha.cantor_banda || "—"}</span>
            );
          }
          return (
            <Input
              value={draft.cantor_banda}
              onChange={(e) => setDraft((d) => ({ ...d, cantor_banda: e.target.value }))}
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
              onChange={(e) => setDraft((d) => ({ ...d, tonalidade: e.target.value }))}
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
            return <CartaoYoutube linha={linha} />;
          }
          return (
            <div className="flex items-center gap-1">
              <Input
                value={draft.link_youtube ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, link_youtube: e.target.value }))}
                onBlur={(e) =>
                  buscarMetadados(e.target.value, (m) =>
                    setDraft((d) => ({
                      ...d,
                      youtube_titulo: m.titulo || d.youtube_titulo,
                      youtube_thumbnail: m.thumbnail,
                    }))
                  )
                }
                placeholder="https://youtube.com/..."
                className="h-8 w-44"
              />
              {buscandoMetadados && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "ultima_execucao",
        header: "Última execução",
        cell: ({ row }) => {
          const linha = row.original;
          const ocupado = savingRowId === linha.id;
          return (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">
                {formatarDataCurta(linha.ultima_execucao)}
              </span>
              {editavel && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  disabled={ocupado}
                  title="Marcar como executado hoje"
                  onClick={() => marcarExecutado(linha.id)}
                >
                  <Calendar className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
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
              <span className="w-5 text-center tabular-nums">{linha.ordem_execucao}</span>
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
    [draft, editingRowId, savingRowId, editavel, expandedId, buscandoMetadados]
  );

  const table = useReactTable({
    data: dadosFiltrados,
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

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou cantor..."
            className="h-8 pl-8"
          />
        </div>
        <select
          value={filtroTom}
          onChange={(e) => setFiltroTom(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Todos os tons</option>
          {tonsDisponiveis.map((tom) => (
            <option key={tom} value={tom}>
              {tom}
            </option>
          ))}
        </select>
        <Button
          variant={somenteFavoritos ? "secondary" : "outline"}
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => setSomenteFavoritos((v) => !v)}
        >
          <Star className={cn("h-3.5 w-3.5", somenteFavoritos && "fill-amber-400 text-amber-500")} />
          Favoritos
        </Button>
      </div>

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
                  {data.length === 0
                    ? `Nenhum louvor cadastrado para ${codigoPrefixo} ainda.`
                    : "Nenhum louvor encontrado com esses filtros."}
                </TableCell>
              </TableRow>
            )}

            {table.getRowModel().rows.map((row) => {
              const linha = row.original;
              const expandido = expandedId === linha.id;
              return (
                <React.Fragment key={row.id}>
                  <TableRow className={cn(editingRowId === linha.id && "bg-muted/40")}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandido && (
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={columns.length} className="space-y-2 py-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              Cifra
                            </span>
                            <textarea
                              className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-70"
                              placeholder="Cole aqui a cifra ou um link para ela"
                              value={detalhesDraft.cifra}
                              disabled={!editavel}
                              onChange={(e) =>
                                setDetalhesDraft((d) => ({ ...d, cifra: e.target.value }))
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              Observações
                            </span>
                            <textarea
                              className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-70"
                              placeholder="Observações sobre o louvor"
                              value={detalhesDraft.observacoes}
                              disabled={!editavel}
                              onChange={(e) =>
                                setDetalhesDraft((d) => ({ ...d, observacoes: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                        {editavel && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExpandedId(null)}
                            >
                              Fechar
                            </Button>
                            <Button
                              size="sm"
                              disabled={savingDetalhes}
                              onClick={() => salvarDetalhes(linha.id)}
                            >
                              {savingDetalhes ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Salvar"
                              )}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}

            {isAddingRow && (
              <TableRow className="bg-muted/30">
                <TableCell />
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
                  <div className="flex items-center gap-1">
                    <Input
                      placeholder="https://youtube.com/..."
                      className="h-8 w-44"
                      value={newRowDraft.link_youtube ?? ""}
                      onChange={(e) =>
                        setNewRowDraft((d) => ({ ...d, link_youtube: e.target.value }))
                      }
                      onBlur={(e) =>
                        buscarMetadados(e.target.value, (m) =>
                          setNewRowDraft((d) => ({
                            ...d,
                            youtube_titulo: m.titulo || d.youtube_titulo,
                            youtube_thumbnail: m.thumbnail,
                          }))
                        )
                      }
                    />
                    {buscandoMetadados && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell />
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
