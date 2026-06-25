"use client";

import * as React from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

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
import type { Departamento } from "@/types/database.types";

export type DepartamentoEditavel = { nome: string; codigoPrefixo: string };

export interface NovoDepartamentoInput {
  nome: string;
  codigoPrefixo: string;
}

export interface DepartamentosManagerProps {
  data: Departamento[];
  onCriarDepartamento: (valores: NovoDepartamentoInput) => Promise<void>;
  onAtualizarDepartamento: (id: string, valores: DepartamentoEditavel) => Promise<void>;
  onRemoverDepartamento: (id: string) => Promise<void>;
}

const DRAFT_VAZIO: DepartamentoEditavel = { nome: "", codigoPrefixo: "" };

export function DepartamentosManager({
  data,
  onCriarDepartamento,
  onAtualizarDepartamento,
  onRemoverDepartamento,
}: DepartamentosManagerProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DepartamentoEditavel>(DRAFT_VAZIO);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [confirmandoRemocaoId, setConfirmandoRemocaoId] = React.useState<string | null>(null);
  const [isCriando, setIsCriando] = React.useState(false);
  const [novoDraft, setNovoDraft] = React.useState<NovoDepartamentoInput>(DRAFT_VAZIO);
  const [isSavingNovo, setIsSavingNovo] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  function iniciarEdicao(departamento: Departamento) {
    setErro(null);
    setEditingId(departamento.id);
    setDraft({ nome: departamento.nome, codigoPrefixo: departamento.codigo_prefixo });
  }

  function cancelarEdicao() {
    setEditingId(null);
    setDraft(DRAFT_VAZIO);
  }

  async function salvarEdicao(id: string) {
    if (!draft.nome.trim() || !draft.codigoPrefixo.trim()) {
      setErro("Informe nome e prefixo antes de salvar.");
      return;
    }
    setSavingId(id);
    setErro(null);
    try {
      await onAtualizarDepartamento(id, {
        nome: draft.nome.trim(),
        codigoPrefixo: draft.codigoPrefixo.trim().toUpperCase(),
      });
      setEditingId(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar esse departamento.");
    } finally {
      setSavingId(null);
    }
  }

  async function remover(id: string) {
    setSavingId(id);
    setErro(null);
    try {
      await onRemoverDepartamento(id);
      setConfirmandoRemocaoId(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível remover esse departamento.");
    } finally {
      setSavingId(null);
    }
  }

  async function salvarNovoDepartamento() {
    if (!novoDraft.nome.trim() || !novoDraft.codigoPrefixo.trim()) {
      setErro("Informe nome e prefixo antes de criar o departamento.");
      return;
    }
    setIsSavingNovo(true);
    setErro(null);
    try {
      await onCriarDepartamento({
        nome: novoDraft.nome.trim(),
        codigoPrefixo: novoDraft.codigoPrefixo.trim().toUpperCase(),
      });
      setIsCriando(false);
      setNovoDraft(DRAFT_VAZIO);
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível criar esse departamento. Verifique se o prefixo já está em uso."
      );
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

      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Prefixo</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((departamento) => {
              const emEdicao = editingId === departamento.id;
              const salvando = savingId === departamento.id;
              const confirmandoRemocao = confirmandoRemocaoId === departamento.id;

              return (
                <TableRow key={departamento.id} className={cn(emEdicao && "bg-muted/40")}>
                  <TableCell>
                    {emEdicao ? (
                      <Input
                        className="h-8"
                        value={draft.nome}
                        onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))}
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">{departamento.nome}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {emEdicao ? (
                      <Input
                        className="h-8 w-24 font-mono uppercase"
                        value={draft.codigoPrefixo}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, codigoPrefixo: e.target.value }))
                        }
                        maxLength={6}
                      />
                    ) : (
                      <span className="font-mono text-sm">{departamento.codigo_prefixo}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{departamento.slug}</TableCell>
                  <TableCell className="text-right">
                    {emEdicao ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                          disabled={salvando}
                          onClick={() => salvarEdicao(departamento.id)}
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
                    ) : confirmandoRemocao ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">
                          Remover e apagar todos os louvores?
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          disabled={salvando}
                          onClick={() => remover(departamento.id)}
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
                          onClick={() => setConfirmandoRemocaoId(null)}
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
                          onClick={() => iniciarEdicao(departamento)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => setConfirmandoRemocaoId(departamento.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}

            {isCriando && (
              <TableRow className="bg-muted/30">
                <TableCell>
                  <Input
                    className="h-8"
                    placeholder="Ex: Jovens"
                    value={novoDraft.nome}
                    onChange={(e) => setNovoDraft((d) => ({ ...d, nome: e.target.value }))}
                    autoFocus
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="h-8 w-24 font-mono uppercase"
                    placeholder="Ex: SA"
                    value={novoDraft.codigoPrefixo}
                    onChange={(e) =>
                      setNovoDraft((d) => ({ ...d, codigoPrefixo: e.target.value }))
                    }
                    maxLength={6}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  gerado automaticamente
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                      disabled={isSavingNovo}
                      onClick={salvarNovoDepartamento}
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
                      onClick={() => {
                        setIsCriando(false);
                        setNovoDraft(DRAFT_VAZIO);
                      }}
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
        {data.map((departamento) => {
          const emEdicao = editingId === departamento.id;
          const salvando = savingId === departamento.id;
          const confirmandoRemocao = confirmandoRemocaoId === departamento.id;

          return (
            <div
              key={departamento.id}
              className={cn("rounded-lg border bg-white/70 p-3", emEdicao && "bg-muted/40")}
            >
              {emEdicao ? (
                <div className="flex flex-col gap-2">
                  <Input
                    className="h-9"
                    value={draft.nome}
                    onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))}
                    autoFocus
                  />
                  <Input
                    className="h-9 w-28 font-mono uppercase"
                    value={draft.codigoPrefixo}
                    onChange={(e) => setDraft((d) => ({ ...d, codigoPrefixo: e.target.value }))}
                    maxLength={6}
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" size="sm" disabled={salvando} onClick={cancelarEdicao}>
                      <X className="mr-1 h-4 w-4" /> Cancelar
                    </Button>
                    <Button size="sm" disabled={salvando} onClick={() => salvarEdicao(departamento.id)}>
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
                    <span className="font-medium leading-tight">{departamento.nome}</span>
                    <span className="font-mono text-sm text-muted-foreground">
                      {departamento.codigo_prefixo}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{departamento.slug}</p>

                  {confirmandoRemocao ? (
                    <div className="mt-2.5 flex items-center justify-between gap-2 border-t pt-2">
                      <span className="text-xs text-muted-foreground">
                        Remover e apagar todos os louvores?
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          disabled={salvando}
                          onClick={() => remover(departamento.id)}
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
                          onClick={() => setConfirmandoRemocaoId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5 flex justify-end gap-1 border-t pt-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => iniciarEdicao(departamento)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => setConfirmandoRemocaoId(departamento.id)}
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

        {isCriando && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex flex-col gap-2">
              <Input
                className="h-9"
                placeholder="Ex: Jovens"
                value={novoDraft.nome}
                onChange={(e) => setNovoDraft((d) => ({ ...d, nome: e.target.value }))}
                autoFocus
              />
              <Input
                className="h-9 w-28 font-mono uppercase"
                placeholder="Ex: SA"
                value={novoDraft.codigoPrefixo}
                onChange={(e) => setNovoDraft((d) => ({ ...d, codigoPrefixo: e.target.value }))}
                maxLength={6}
              />
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSavingNovo}
                  onClick={() => {
                    setIsCriando(false);
                    setNovoDraft(DRAFT_VAZIO);
                  }}
                >
                  <X className="mr-1 h-4 w-4" /> Cancelar
                </Button>
                <Button size="sm" disabled={isSavingNovo} onClick={salvarNovoDepartamento}>
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

      {!isCriando && (
        <Button
          variant="outline"
          size="sm"
          className="w-fit gap-2"
          onClick={() => setIsCriando(true)}
        >
          <Plus className="h-4 w-4" />
          Criar departamento
        </Button>
      )}
    </div>
  );
}

export default DepartamentosManager;
