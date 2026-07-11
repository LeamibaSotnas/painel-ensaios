"use client";

import * as React from "react";
import {
  CalendarDays,
  Check,
  List,
  Loader2,
  MessageSquarePlus,
  Pencil,
  Plus,
  Send,
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

type PrioridadeObs = "NORMAL" | "ALTA" | "URGENTE";

export interface EnsaioGridProps {
  data: EnsaioGradeComDepartamento[];
  departamentos: Departamento[];
  /** Quando `false`, o cronograma fica somente leitura (sem agendar/editar/remover). */
  editavel?: boolean;
  onAtualizarEnsaio: (id: string, valores: EnsaioEditavel) => Promise<{ erro?: string } | void>;
  onAdicionarEnsaio: (valores: EnsaioEditavel) => Promise<{ erro?: string } | void>;
  onRemoverEnsaio: (id: string) => Promise<{ erro?: string } | void>;
  /** Quando fornecido, exibe o botão "Inserir Observação" — broadcast global. */
  onCriarObservacao?: (dados: {
    titulo: string;
    descricao: string;
    prioridade: PrioridadeObs;
  }) => Promise<{ erro?: string }>;
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
      className="h-8 w-36 rounded-lg border border-violet-200 bg-white/70 px-2 text-sm shadow-sm transition-all focus-visible:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
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
        className="min-h-8 resize-none rounded-lg border border-violet-200 bg-white/70 px-3 py-1.5 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
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

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {celulas.map((celula, index) => {
          if (!celula.data) {
            return <div key={`vazio-${index}`} className="min-h-12 rounded-md sm:min-h-20" />;
          }
          const ensaiosDoDia = ensaiosPorDia.get(celula.data) ?? [];
          const dia = Number(celula.data.slice(-2));
          const visiveis = ensaiosDoDia.slice(0, 2);
          const restantes = ensaiosDoDia.length - visiveis.length;
          return (
            <div
              key={celula.data}
              className="min-h-12 rounded-md border bg-muted/20 p-0.5 text-[10px] sm:min-h-20 sm:p-1 sm:text-xs"
            >
              <span className="text-muted-foreground">{dia}</span>
              <div className="mt-0.5 flex flex-col gap-0.5 sm:mt-1">
                {visiveis.map((ensaio) => (
                  <span
                    key={ensaio.id}
                    className="truncate rounded bg-primary/10 px-1 py-0.5 text-primary"
                    title={`${ensaio.departamento_nome} · ${ensaio.hora_inicio.slice(0, 5)}`}
                  >
                    {ensaio.hora_inicio.slice(0, 5)} {ensaio.departamento_nome}
                  </span>
                ))}
                {restantes > 0 && (
                  <span className="text-muted-foreground">+{restantes}</span>
                )}
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
  editavel = true,
  onAtualizarEnsaio,
  onAdicionarEnsaio,
  onRemoverEnsaio,
  onCriarObservacao,
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

  // ── Modal de observação broadcast ────────────────────────────────────────
  const [isObsOpen, setIsObsOpen] = React.useState(false);
  const [obsTitulo, setObsTitulo] = React.useState("");
  const [obsTexto, setObsTexto] = React.useState("");
  const [obsPrioridade, setObsPrioridade] = React.useState<PrioridadeObs>("NORMAL");
  const [isSavingObs, setIsSavingObs] = React.useState(false);
  const [obsErro, setObsErro] = React.useState<string | null>(null);

  async function salvarObservacao() {
    if (!onCriarObservacao || !obsTexto.trim()) return;
    setIsSavingObs(true);
    setObsErro(null);
    try {
      const resultado = await onCriarObservacao({
        titulo: obsTitulo.trim() || "Observação geral",
        descricao: obsTexto.trim(),
        prioridade: obsPrioridade,
      });
      if (resultado?.erro) {
        setObsErro(resultado.erro);
        return;
      }
      setIsObsOpen(false);
      setObsTitulo("");
      setObsTexto("");
      setObsPrioridade("NORMAL");
    } catch (e) {
      setObsErro(e instanceof Error ? e.message : "Não foi possível enviar a observação.");
    } finally {
      setIsSavingObs(false);
    }
  }

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
      const resultado = await onAtualizarEnsaio(id, draft);
      if (resultado?.erro) {
        setErro(resultado.erro);
        return;
      }
      setEditingId(null);
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : "Não foi possível salvar esse ensaio.");
    } finally {
      setSavingId(null);
    }
  }

  async function remover(id: string) {
    setSavingId(id);
    setErro(null);
    try {
      const resultado = await onRemoverEnsaio(id);
      if (resultado?.erro) {
        setErro(resultado.erro);
      }
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : "Não foi possível remover esse ensaio.");
    } finally {
      setSavingId(null);
    }
  }

  async function salvarNovo() {
    setIsSavingNovo(true);
    setErro(null);
    try {
      const resultado = await onAdicionarEnsaio(novoDraft);
      if (resultado?.erro) {
        setErro(resultado.erro);
        return;
      }
      setIsAdding(false);
      setNovoDraft(DRAFT_VAZIO(departamentos[0]?.id ?? ""));
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : "Não foi possível adicionar o ensaio.");
    } finally {
      setIsSavingNovo(false);
    }
  }

  return (
    <>
    {/* ── Modal de observação broadcast ────────────────────────────────────── */}
    {isObsOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      >
        <div
          className="relative w-full max-w-lg rounded-2xl border border-white/20 p-6 shadow-2xl"
          style={{
            background:
              "linear-gradient(145deg, rgba(12,8,35,0.97) 0%, rgba(25,15,70,0.97) 55%, rgba(40,10,55,0.97) 100%)",
          }}
        >
          {/* Header do modal */}
          <div className="mb-5 flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md"
              style={{
                background: "linear-gradient(135deg,#f59e0b,#ea580c)",
                boxShadow: "0 4px 14px -4px rgba(245,158,11,0.50)",
              }}
            >
              <MessageSquarePlus className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                className="text-xl font-black"
                style={{
                  background: "linear-gradient(90deg,#fbbf24,#fb923c)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Nova Observação
              </h2>
              <p className="text-[11px] text-white/45">
                Disparada automaticamente para todos os departamentos
              </p>
            </div>
            <button
              onClick={() => setIsObsOpen(false)}
              className="ml-2 rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Campo: Título */}
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-white/55">
            Título
          </label>
          <input
            value={obsTitulo}
            onChange={(e) => setObsTitulo(e.target.value)}
            placeholder="Assunto da observação..."
            className="mb-4 w-full rounded-xl border border-white/12 bg-white/[0.07] px-4 py-2.5 text-sm text-white placeholder:text-white/30 transition-all focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
          />

          {/* Campo: Mensagem */}
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-white/55">
            Mensagem
          </label>
          <textarea
            value={obsTexto}
            onChange={(e) => setObsTexto(e.target.value)}
            placeholder="Escreva a observação para todos os departamentos..."
            rows={5}
            className="mb-4 w-full resize-none rounded-xl border border-white/12 bg-white/[0.07] px-4 py-3 text-sm text-white placeholder:text-white/30 transition-all focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
          />

          {/* Seletor de prioridade */}
          <div className="mb-5 flex gap-2">
            {(["NORMAL", "ALTA", "URGENTE"] as PrioridadeObs[]).map((p) => {
              const ativo = obsPrioridade === p;
              const cor =
                p === "URGENTE"
                  ? ativo ? "bg-red-500 text-white shadow-md shadow-red-500/40" : "border border-red-400/20 text-red-300/60 hover:border-red-400/40"
                  : p === "ALTA"
                  ? ativo ? "bg-amber-500 text-white shadow-md shadow-amber-500/40" : "border border-amber-400/20 text-amber-300/60 hover:border-amber-400/40"
                  : ativo ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30" : "border border-emerald-500/20 text-emerald-300/60 hover:border-emerald-500/40";
              return (
                <button
                  key={p}
                  onClick={() => setObsPrioridade(p)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200",
                    cor
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {obsErro && (
            <p className="mb-3 rounded-xl border border-red-400/25 bg-red-900/30 px-3 py-2 text-xs text-red-300">
              {obsErro}
            </p>
          )}

          {/* Botão de envio — respira com animação btn-breathe */}
          <button
            onClick={salvarObservacao}
            disabled={isSavingObs || !obsTexto.trim()}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white",
              "transition-all duration-200 active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            style={{
              background: "linear-gradient(135deg,#f59e0b 0%,#ea580c 100%)",
              animation: !isSavingObs && obsTexto.trim()
                ? "btn-breathe 2.2s ease-in-out infinite"
                : undefined,
            }}
          >
            {isSavingObs ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando para todos...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Disparar para todos os departamentos
              </>
            )}
          </button>
        </div>
      </div>
    )}

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
        <div className="hidden overflow-x-auto rounded-lg border md:block">
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
                            title="Salvar"
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
                            title="Cancelar"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        editavel && (
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
                        )
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {editavel && isAdding && (
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
                        title="Salvar"
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
                        title="Cancelar"
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

      {/* Versão mobile — lista de cards, dedicada para telas pequenas */}
      {visao === "lista" && (
        <div className="flex flex-col gap-2.5 md:hidden">
          {data.length === 0 && !isAdding && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum ensaio agendado ainda.
            </p>
          )}

          {data.map((ensaio) => {
            const emEdicao = editingId === ensaio.id;
            const salvando = savingId === ensaio.id;

            return (
              <div
                key={ensaio.id}
                className={cn("rounded-lg border bg-white/70 p-3", emEdicao && "bg-muted/40")}
              >
                {emEdicao ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        className="h-9 flex-1"
                        value={draft.data}
                        onChange={(e) => setDraft((d) => ({ ...d, data: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        className="h-9 flex-1"
                        value={draft.hora_inicio}
                        onChange={(e) => setDraft((d) => ({ ...d, hora_inicio: e.target.value }))}
                      />
                      <Input
                        type="time"
                        className="h-9 flex-1"
                        value={draft.hora_fim}
                        onChange={(e) => setDraft((d) => ({ ...d, hora_fim: e.target.value }))}
                      />
                    </div>
                    <SeletorDepartamento
                      value={draft.departamento_id}
                      onChange={(id) => setDraft((d) => ({ ...d, departamento_id: id }))}
                      departamentos={departamentos}
                    />
                    <CamposExtras
                      draft={draft}
                      onChange={(valores) => setDraft((d) => ({ ...d, ...valores }))}
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <Button variant="outline" size="sm" disabled={salvando} onClick={cancelarEdicao}>
                        <X className="mr-1 h-4 w-4" /> Cancelar
                      </Button>
                      <Button size="sm" disabled={salvando} onClick={() => salvarEdicao(ensaio.id)}>
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
                      <span className="font-medium capitalize leading-tight">
                        {formatarDataExibicao(ensaio.data)}
                      </span>
                      <Badge variant="outline">{ensaio.departamento_nome}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ensaio.hora_inicio.slice(0, 5)} – {ensaio.hora_fim.slice(0, 5)}
                    </p>
                    {(ensaio.local || ensaio.responsavel || ensaio.observacoes) && (
                      <div className="mt-1.5 flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {(ensaio.local || ensaio.responsavel) && (
                          <span>{[ensaio.local, ensaio.responsavel].filter(Boolean).join(" · ")}</span>
                        )}
                        {ensaio.observacoes && <span>{ensaio.observacoes}</span>}
                      </div>
                    )}
                    {editavel && (
                      <div className="mt-2.5 flex justify-end gap-1 border-t pt-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => iniciarEdicao(ensaio)}>
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
                  </>
                )}
              </div>
            );
          })}

          {editavel && isAdding && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex flex-col gap-2">
                <Input
                  type="date"
                  className="h-9"
                  value={novoDraft.data}
                  onChange={(e) => setNovoDraft((d) => ({ ...d, data: e.target.value }))}
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    className="h-9 flex-1"
                    value={novoDraft.hora_inicio}
                    onChange={(e) => setNovoDraft((d) => ({ ...d, hora_inicio: e.target.value }))}
                  />
                  <Input
                    type="time"
                    className="h-9 flex-1"
                    value={novoDraft.hora_fim}
                    onChange={(e) => setNovoDraft((d) => ({ ...d, hora_fim: e.target.value }))}
                  />
                </div>
                <SeletorDepartamento
                  value={novoDraft.departamento_id}
                  onChange={(id) => setNovoDraft((d) => ({ ...d, departamento_id: id }))}
                  departamentos={departamentos}
                />
                <CamposExtras
                  draft={novoDraft}
                  onChange={(valores) => setNovoDraft((d) => ({ ...d, ...valores }))}
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" disabled={isSavingNovo} onClick={() => setIsAdding(false)}>
                    <X className="mr-1 h-4 w-4" /> Cancelar
                  </Button>
                  <Button size="sm" disabled={isSavingNovo} onClick={salvarNovo}>
                    {isSavingNovo ? (
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
      )}

      {/* Botões de ação — aparecem quando não está adicionando ensaio */}
      {editavel && visao === "lista" && !isAdding && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              setIsAdding(true);
              setNovoDraft(DRAFT_VAZIO(departamentos[0]?.id ?? ""));
            }}
          >
            <Plus className="h-4 w-4" />
            Agendar ensaio
          </Button>

          {onCriarObservacao && (
            <button
              onClick={() => {
                setObsErro(null);
                setIsObsOpen(true);
              }}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white",
                "transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              )}
              style={{
                background: "linear-gradient(135deg,#f59e0b 0%,#ea580c 80%)",
                boxShadow: "0 4px 14px -4px rgba(245,158,11,0.55)",
              }}
            >
              <MessageSquarePlus className="h-4 w-4 shrink-0" />
              Inserir Observação
            </button>
          )}
        </div>
      )}

      {/* Botão "Inserir Observação" também disponível enquanto está adicionando ensaio */}
      {editavel && isAdding && onCriarObservacao && (
        <button
          onClick={() => {
            setObsErro(null);
            setIsObsOpen(true);
          }}
          className={cn(
            "w-fit flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white",
            "transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          )}
          style={{
            background: "linear-gradient(135deg,#f59e0b 0%,#ea580c 80%)",
            boxShadow: "0 4px 14px -4px rgba(245,158,11,0.55)",
          }}
        >
          <MessageSquarePlus className="h-4 w-4 shrink-0" />
          Inserir Observação
        </button>
      )}
    </div>
    </>
  );
}

export default EnsaioGrid;
