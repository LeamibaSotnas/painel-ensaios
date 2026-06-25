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
  Sparkles,
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
import type { ResultadoBuscaYoutube } from "@/core/utils/youtube";

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
  /** Busca inteligente por título/cantor (YouTube Data API, quando configurada). */
  onBuscarVideosYoutube: (query: string) => Promise<ResultadoBuscaYoutube[] | null>;
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
  onBuscarVideosYoutube,
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
  const [buscandoVideos, setBuscandoVideos] = React.useState(false);
  const [painelBusca, setPainelBusca] = React.useState<{
    contexto: "editing" | "novo";
    resultados: ResultadoBuscaYoutube[];
  } | null>(null);

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

  async function buscarVideos(contexto: "editing" | "novo") {
    const origem = contexto === "editing" ? draft : newRowDraft;
    const query = [origem.nome_louvor, origem.cantor_banda].filter(Boolean).join(" ").trim();
    if (!query) {
      setErro("Digite o nome do louvor (e o cantor, se tiver) antes de buscar.");
      return;
    }
    setErro(null);
    setBuscandoVideos(true);
    try {
      const resultados = await onBuscarVideosYoutube(query);
      if (resultados === null) {
        // Sem busca inteligente configurada: abre a busca do YouTube numa nova aba.
        window.open(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
          "_blank",
          "noopener,noreferrer"
        );
        return;
      }
      setPainelBusca({ contexto, resultados });
    } catch {
      setErro("Não foi possível buscar no YouTube agora.");
    } finally {
      setBuscandoVideos(false);
    }
  }

  function selecionarVideoBusca(contexto: "editing" | "novo", resultado: ResultadoBuscaYoutube) {
    const aplicar = (d: DraftLouvor): DraftLouvor => ({
      ...d,
      link_youtube: `https://www.youtube.com/watch?v=${resultado.id}`,
      youtube_titulo: resultado.titulo || d.youtube_titulo,
      youtube_thumbnail: resultado.thumbnail,
    });
    if (contexto === "editing") {
      setDraft(aplicar);
    } else {
      setNewRowDraft(aplicar);
    }
    setPainelBusca(null);
  }

  function PainelBuscaYoutube({ contexto }: { contexto: "editing" | "novo" }) {
    if (!painelBusca || painelBusca.contexto !== contexto) return null;
    return (
      <div className="absolute left-0 top-full z-20 mt-1 w-72 max-w-[90vw] rounded-xl border border-violet-100 bg-white p-1.5 shadow-lg shadow-violet-900/15">
        <div className="flex items-center justify-between px-1.5 pb-1">
          <span className="text-[11px] font-medium text-muted-foreground">
            Resultados do YouTube
          </span>
          <button
            type="button"
            onClick={() => setPainelBusca(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {painelBusca.resultados.length === 0 ? (
          <p className="px-1.5 py-2 text-xs text-muted-foreground">Nenhum resultado encontrado.</p>
        ) : (
          <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
            {painelBusca.resultados.map((resultado) => (
              <button
                key={resultado.id}
                type="button"
                onClick={() => selecionarVideoBusca(contexto, resultado)}
                className="flex items-center gap-2 rounded-lg p-1.5 text-left transition-colors hover:bg-violet-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultado.thumbnail}
                  alt=""
                  className="h-9 w-16 shrink-0 rounded-md object-cover"
                />
                <span className="flex flex-col overflow-hidden">
                  <span className="truncate text-xs font-medium">{resultado.titulo}</span>
                  <span className="truncate text-[10px] text-muted-foreground">
                    {resultado.canal}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  function BotaoBuscarYoutube({ contexto }: { contexto: "editing" | "novo" }) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-violet-600 hover:bg-violet-100 hover:text-violet-700"
        title="Busca inteligente no YouTube"
        disabled={buscandoVideos}
        onClick={() => buscarVideos(contexto)}
      >
        {buscandoVideos ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
      </Button>
    );
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
            <div className="relative flex items-center gap-1">
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
                className="h-8 w-40"
              />
              <BotaoBuscarYoutube contexto="editing" />
              {buscandoMetadados && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
              <PainelBuscaYoutube contexto="editing" />
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
    [
      draft,
      newRowDraft,
      editingRowId,
      savingRowId,
      editavel,
      expandedId,
      buscandoMetadados,
      buscandoVideos,
      painelBusca,
    ]
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
          className="h-8 rounded-lg border border-violet-200 bg-white/70 px-2 text-sm shadow-sm transition-all focus-visible:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
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

      <div className="hidden overflow-x-auto rounded-lg border md:block">
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
                              className="min-h-24 rounded-lg border border-violet-200 bg-white/70 px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 disabled:opacity-70"
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
                              className="min-h-24 rounded-lg border border-violet-200 bg-white/70 px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 disabled:opacity-70"
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
                  <div className="relative flex items-center gap-1">
                    <Input
                      placeholder="https://youtube.com/..."
                      className="h-8 w-40"
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
                    <BotaoBuscarYoutube contexto="novo" />
                    {buscandoMetadados && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                    <PainelBuscaYoutube contexto="novo" />
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

      {/* Versão mobile — lista de cards, dedicada para telas pequenas */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {dadosFiltrados.length === 0 && !isAddingRow && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {data.length === 0
              ? `Nenhum louvor cadastrado para ${codigoPrefixo} ainda.`
              : "Nenhum louvor encontrado com esses filtros."}
          </p>
        )}

        {table.getRowModel().rows.map((row) => {
          const linha = row.original;
          const emEdicao = editingRowId === linha.id;
          const expandido = expandedId === linha.id;
          const salvando = savingRowId === linha.id;

          return (
            <div
              key={linha.id}
              className={cn(
                "rounded-lg border bg-white/70 p-3",
                emEdicao && "bg-muted/40"
              )}
            >
              {emEdicao ? (
                <div className="flex flex-col gap-2">
                  <Input
                    value={draft.nome_louvor}
                    onChange={(e) => setDraft((d) => ({ ...d, nome_louvor: e.target.value }))}
                    placeholder="Nome do louvor"
                    className="h-9"
                    autoFocus
                  />
                  <Input
                    value={draft.cantor_banda}
                    onChange={(e) => setDraft((d) => ({ ...d, cantor_banda: e.target.value }))}
                    placeholder="Cantor, compositor ou banda/grupo"
                    className="h-9"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      value={draft.tonalidade}
                      onChange={(e) => setDraft((d) => ({ ...d, tonalidade: e.target.value }))}
                      placeholder="Tom (ex: G, Am)"
                      className="h-9 w-28"
                    />
                    {buscandoMetadados && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <div className="relative flex items-center gap-1">
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
                      className="h-9"
                    />
                    <BotaoBuscarYoutube contexto="editing" />
                    <PainelBuscaYoutube contexto="editing" />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" size="sm" disabled={salvando} onClick={cancelarEdicao}>
                      <X className="mr-1 h-4 w-4" /> Cancelar
                    </Button>
                    <Button size="sm" disabled={salvando} onClick={() => salvarEdicao(linha.id)}>
                      {salvando ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-1 h-4 w-4" />
                      )}
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => alternarExpandido(linha)}
                      className="flex flex-1 items-start gap-1.5 text-left"
                    >
                      {expandido ? (
                        <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span>
                        <span className="block font-medium leading-tight">{linha.nome_louvor}</span>
                        <span className="block text-xs text-muted-foreground">
                          {linha.cantor_banda || "—"}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => alternarFavorito(linha)}
                      className="shrink-0 text-muted-foreground/50 transition-colors hover:text-amber-500"
                      title={linha.favorito ? "Remover dos favoritos" : "Marcar como favorito"}
                    >
                      <Star
                        className={cn("h-5 w-5", linha.favorito && "fill-amber-400 text-amber-500")}
                      />
                    </button>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="font-mono">
                      {linha.codigo_sequencial}
                    </Badge>
                    {linha.tonalidade && <Badge variant="outline">{linha.tonalidade}</Badge>}
                    <span className="text-xs text-muted-foreground">
                      Última: {formatarDataCurta(linha.ultima_execucao)}
                    </span>
                  </div>

                  <div className="mt-2">
                    <CartaoYoutube linha={linha} />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t pt-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      Ordem
                      <span className="w-5 text-center font-medium tabular-nums text-foreground">
                        {linha.ordem_execucao}
                      </span>
                      {editavel && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={salvando}
                            onClick={() => reordenar(linha.id, "up")}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={salvando}
                            onClick={() => reordenar(linha.id, "down")}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                    {editavel && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          disabled={salvando}
                          title="Marcar como executado hoje"
                          onClick={() => marcarExecutado(linha.id)}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
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
                          disabled={salvando}
                          onClick={() => excluirLinha(linha.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {expandido && (
                    <div className="mt-2.5 space-y-2 border-t pt-2.5">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground">Cifra</span>
                        <textarea
                          className="min-h-20 rounded-lg border border-violet-200 bg-white/70 px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 disabled:opacity-70"
                          placeholder="Cole aqui a cifra ou um link para ela"
                          value={detalhesDraft.cifra}
                          disabled={!editavel}
                          onChange={(e) => setDetalhesDraft((d) => ({ ...d, cifra: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          Observações
                        </span>
                        <textarea
                          className="min-h-20 rounded-lg border border-violet-200 bg-white/70 px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 disabled:opacity-70"
                          placeholder="Observações sobre o louvor"
                          value={detalhesDraft.observacoes}
                          disabled={!editavel}
                          onChange={(e) =>
                            setDetalhesDraft((d) => ({ ...d, observacoes: e.target.value }))
                          }
                        />
                      </div>
                      {editavel && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setExpandedId(null)}>
                            Fechar
                          </Button>
                          <Button size="sm" disabled={savingDetalhes} onClick={() => salvarDetalhes(linha.id)}>
                            {savingDetalhes ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Salvar"
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {isAddingRow && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-muted-foreground">
                  {codigoPrefixo}?
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Ordem {newRowDraft.ordem_execucao}
                </span>
              </div>
              <Input
                autoFocus
                placeholder="Nome do louvor"
                className="h-9"
                value={newRowDraft.nome_louvor}
                onChange={(e) => setNewRowDraft((d) => ({ ...d, nome_louvor: e.target.value }))}
              />
              <Input
                placeholder="Cantor, compositor ou banda/grupo"
                className="h-9"
                value={newRowDraft.cantor_banda}
                onChange={(e) => setNewRowDraft((d) => ({ ...d, cantor_banda: e.target.value }))}
              />
              <Input
                placeholder="Tom"
                className="h-9 w-28"
                value={newRowDraft.tonalidade}
                onChange={(e) => setNewRowDraft((d) => ({ ...d, tonalidade: e.target.value }))}
              />
              <div className="relative flex items-center gap-2">
                <Input
                  placeholder="https://youtube.com/..."
                  className="h-9"
                  value={newRowDraft.link_youtube ?? ""}
                  onChange={(e) => setNewRowDraft((d) => ({ ...d, link_youtube: e.target.value }))}
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
                <BotaoBuscarYoutube contexto="novo" />
                {buscandoMetadados && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                <PainelBuscaYoutube contexto="novo" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" disabled={isSavingNewRow} onClick={() => setIsAddingRow(false)}>
                  <X className="mr-1 h-4 w-4" /> Cancelar
                </Button>
                <Button size="sm" disabled={isSavingNewRow} onClick={salvarNovaLinha}>
                  {isSavingNewRow ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-1 h-4 w-4" />
                  )}
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        )}
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
