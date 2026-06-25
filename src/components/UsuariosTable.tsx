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
import type { Departamento, RegraUsuario, UsuarioComDepartamento } from "@/types/database.types";

export interface UsuarioEditavel {
  nome: string;
  regra: RegraUsuario;
  departamentoId: string | null;
}

export interface NovoUsuarioInput {
  nome: string;
  email: string;
  senha: string;
  regra: RegraUsuario;
  departamentoId: string | null;
}

export interface UsuariosTableProps {
  data: UsuarioComDepartamento[];
  departamentos: Departamento[];
  /** id do usuário logado — evita que ele remova/rebaixe a própria conta. */
  usuarioAtualId: string;
  /** Papéis que o usuário logado tem permissão de atribuir a outros. */
  regrasPermitidas?: RegraUsuario[];
  onAtualizarUsuario: (id: string, valores: UsuarioEditavel) => Promise<void>;
  onRemoverUsuario: (id: string) => Promise<void>;
  onCriarUsuario: (valores: NovoUsuarioInput) => Promise<void>;
}

const REGRAS: RegraUsuario[] = ["ADMIN", "ADMIN_PAINEL", "LIDER", "MUSICOS"];

const LABEL_REGRA: Record<RegraUsuario, string> = {
  ADMIN: "Super Admin",
  ADMIN_PAINEL: "Admin de Painel",
  LIDER: "Líder",
  MUSICOS: "Membro",
};

const VARIANTE_BADGE_REGRA: Record<RegraUsuario, "default" | "secondary" | "outline"> = {
  ADMIN: "default",
  ADMIN_PAINEL: "default",
  LIDER: "secondary",
  MUSICOS: "outline",
};

function SeletorRegra({
  value,
  onChange,
  regras = REGRAS,
}: {
  value: RegraUsuario;
  onChange: (regra: RegraUsuario) => void;
  regras?: RegraUsuario[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as RegraUsuario)}
      className="h-8 w-36 rounded-lg border border-violet-200 bg-white/70 px-2 text-sm shadow-sm transition-all focus-visible:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
    >
      {regras.map((regra) => (
        <option key={regra} value={regra}>
          {LABEL_REGRA[regra]}
        </option>
      ))}
    </select>
  );
}

function SeletorDepartamento({
  value,
  onChange,
  departamentos,
  disabled,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  departamentos: Departamento[];
  disabled?: boolean;
}) {
  if (disabled) {
    return <span className="text-xs text-muted-foreground">Todos os departamentos</span>;
  }
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="h-8 w-36 rounded-lg border border-violet-200 bg-white/70 px-2 text-sm shadow-sm transition-all focus-visible:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
    >
      <option value="" disabled>
        Selecione...
      </option>
      {departamentos.map((dep) => (
        <option key={dep.id} value={dep.id}>
          {dep.nome}
        </option>
      ))}
    </select>
  );
}

export function UsuariosTable({
  data,
  departamentos,
  usuarioAtualId,
  regrasPermitidas = REGRAS,
  onAtualizarUsuario,
  onRemoverUsuario,
  onCriarUsuario,
}: UsuariosTableProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<UsuarioEditavel>({
    nome: "",
    regra: "MUSICOS",
    departamentoId: departamentos[0]?.id ?? null,
  });
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [isCriando, setIsCriando] = React.useState(false);
  const [novoUsuarioDraft, setNovoUsuarioDraft] = React.useState<NovoUsuarioInput>({
    nome: "",
    email: "",
    senha: "",
    regra: "MUSICOS",
    departamentoId: departamentos[0]?.id ?? null,
  });
  const [isSavingNovoUsuario, setIsSavingNovoUsuario] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  function iniciarEdicao(usuario: UsuarioComDepartamento) {
    setErro(null);
    setEditingId(usuario.id);
    setDraft({
      nome: usuario.nome,
      regra: usuario.regra,
      departamentoId: usuario.departamento_id,
    });
  }

  function cancelarEdicao() {
    setEditingId(null);
  }

  async function salvarEdicao(id: string) {
    if (draft.regra !== "ADMIN" && !draft.departamentoId) {
      setErro("Selecione um departamento para esse usuário.");
      return;
    }
    setSavingId(id);
    setErro(null);
    try {
      await onAtualizarUsuario(id, {
        ...draft,
        departamentoId: draft.regra === "ADMIN" ? null : draft.departamentoId,
      });
      setEditingId(null);
    } catch {
      setErro("Não foi possível salvar esse usuário.");
    } finally {
      setSavingId(null);
    }
  }

  async function remover(id: string) {
    setSavingId(id);
    setErro(null);
    try {
      await onRemoverUsuario(id);
    } catch {
      setErro("Não foi possível remover esse usuário.");
    } finally {
      setSavingId(null);
    }
  }

  async function salvarNovoUsuario() {
    if (
      !novoUsuarioDraft.nome.trim() ||
      !novoUsuarioDraft.email.trim() ||
      !novoUsuarioDraft.senha.trim()
    ) {
      setErro("Informe nome, e-mail e senha antes de criar o usuário.");
      return;
    }
    if (novoUsuarioDraft.senha.trim().length < 6) {
      setErro("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (novoUsuarioDraft.regra !== "ADMIN" && !novoUsuarioDraft.departamentoId) {
      setErro("Selecione um departamento para esse usuário.");
      return;
    }
    setIsSavingNovoUsuario(true);
    setErro(null);
    try {
      await onCriarUsuario({
        nome: novoUsuarioDraft.nome.trim(),
        email: novoUsuarioDraft.email.trim(),
        senha: novoUsuarioDraft.senha,
        regra: novoUsuarioDraft.regra,
        departamentoId:
          novoUsuarioDraft.regra === "ADMIN" ? null : novoUsuarioDraft.departamentoId,
      });
      setIsCriando(false);
      setNovoUsuarioDraft({
        nome: "",
        email: "",
        senha: "",
        regra: "MUSICOS",
        departamentoId: departamentos[0]?.id ?? null,
      });
    } catch {
      setErro("Não foi possível criar esse usuário. Verifique se o e-mail já está em uso.");
    } finally {
      setIsSavingNovoUsuario(false);
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
              <TableHead>E-mail</TableHead>
              <TableHead>Senha</TableHead>
              <TableHead>Regra</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((usuario) => {
              const emEdicao = editingId === usuario.id;
              const salvando = savingId === usuario.id;
              const ehUsuarioAtual = usuario.id === usuarioAtualId;

              return (
                <TableRow key={usuario.id} className={cn(emEdicao && "bg-muted/40")}>
                  <TableCell>
                    {emEdicao ? (
                      <Input
                        className="h-8"
                        value={draft.nome}
                        onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))}
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">
                        {usuario.nome}
                        {ehUsuarioAtual && (
                          <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                        )}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
                  <TableCell className="text-muted-foreground">••••••••</TableCell>
                  <TableCell>
                    {emEdicao ? (
                      <SeletorRegra
                        value={draft.regra}
                        onChange={(regra) => setDraft((d) => ({ ...d, regra }))}
                        regras={regrasPermitidas}
                      />
                    ) : (
                      <Badge variant={VARIANTE_BADGE_REGRA[usuario.regra]}>
                        {LABEL_REGRA[usuario.regra]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {emEdicao ? (
                      <SeletorDepartamento
                        value={draft.departamentoId}
                        onChange={(id) => setDraft((d) => ({ ...d, departamentoId: id }))}
                        departamentos={departamentos}
                        disabled={draft.regra === "ADMIN"}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {usuario.regra === "ADMIN"
                          ? "Todos"
                          : usuario.departamento_nome ?? "—"}
                      </span>
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
                          onClick={() => salvarEdicao(usuario.id)}
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
                          onClick={() => iniciarEdicao(usuario)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          disabled={salvando || ehUsuarioAtual}
                          title={ehUsuarioAtual ? "Você não pode remover sua própria conta" : undefined}
                          onClick={() => remover(usuario.id)}
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
                    placeholder="Nome"
                    value={novoUsuarioDraft.nome}
                    onChange={(e) =>
                      setNovoUsuarioDraft((d) => ({ ...d, nome: e.target.value }))
                    }
                    autoFocus
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="h-8"
                    type="email"
                    placeholder="email@igreja.org"
                    value={novoUsuarioDraft.email}
                    onChange={(e) =>
                      setNovoUsuarioDraft((d) => ({ ...d, email: e.target.value }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="h-8 w-32"
                    type="password"
                    placeholder="Senha"
                    value={novoUsuarioDraft.senha}
                    onChange={(e) =>
                      setNovoUsuarioDraft((d) => ({ ...d, senha: e.target.value }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <SeletorRegra
                    value={novoUsuarioDraft.regra}
                    onChange={(regra) => setNovoUsuarioDraft((d) => ({ ...d, regra }))}
                    regras={regrasPermitidas}
                  />
                </TableCell>
                <TableCell>
                  <SeletorDepartamento
                    value={novoUsuarioDraft.departamentoId}
                    onChange={(id) =>
                      setNovoUsuarioDraft((d) => ({ ...d, departamentoId: id }))
                    }
                    departamentos={departamentos}
                    disabled={novoUsuarioDraft.regra === "ADMIN"}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                      disabled={isSavingNovoUsuario}
                      onClick={salvarNovoUsuario}
                    >
                      {isSavingNovoUsuario ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isSavingNovoUsuario}
                      onClick={() => setIsCriando(false)}
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
        {data.map((usuario) => {
          const emEdicao = editingId === usuario.id;
          const salvando = savingId === usuario.id;
          const ehUsuarioAtual = usuario.id === usuarioAtualId;

          return (
            <div
              key={usuario.id}
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
                  <SeletorRegra
                    value={draft.regra}
                    onChange={(regra) => setDraft((d) => ({ ...d, regra }))}
                    regras={regrasPermitidas}
                  />
                  <SeletorDepartamento
                    value={draft.departamentoId}
                    onChange={(id) => setDraft((d) => ({ ...d, departamentoId: id }))}
                    departamentos={departamentos}
                    disabled={draft.regra === "ADMIN"}
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" size="sm" disabled={salvando} onClick={cancelarEdicao}>
                      <X className="mr-1 h-4 w-4" /> Cancelar
                    </Button>
                    <Button size="sm" disabled={salvando} onClick={() => salvarEdicao(usuario.id)}>
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
                    <span className="font-medium leading-tight">
                      {usuario.nome}
                      {ehUsuarioAtual && (
                        <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                      )}
                    </span>
                    <Badge variant={VARIANTE_BADGE_REGRA[usuario.regra]}>{LABEL_REGRA[usuario.regra]}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{usuario.email}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {usuario.regra === "ADMIN" ? "Todos os departamentos" : usuario.departamento_nome ?? "—"}
                  </p>
                  <div className="mt-2.5 flex justify-end gap-1 border-t pt-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => iniciarEdicao(usuario)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      disabled={salvando || ehUsuarioAtual}
                      title={ehUsuarioAtual ? "Você não pode remover sua própria conta" : undefined}
                      onClick={() => remover(usuario.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
                placeholder="Nome"
                value={novoUsuarioDraft.nome}
                onChange={(e) => setNovoUsuarioDraft((d) => ({ ...d, nome: e.target.value }))}
                autoFocus
              />
              <Input
                className="h-9"
                type="email"
                placeholder="email@igreja.org"
                value={novoUsuarioDraft.email}
                onChange={(e) => setNovoUsuarioDraft((d) => ({ ...d, email: e.target.value }))}
              />
              <Input
                className="h-9"
                type="password"
                placeholder="Senha"
                value={novoUsuarioDraft.senha}
                onChange={(e) => setNovoUsuarioDraft((d) => ({ ...d, senha: e.target.value }))}
              />
              <SeletorRegra
                value={novoUsuarioDraft.regra}
                onChange={(regra) => setNovoUsuarioDraft((d) => ({ ...d, regra }))}
                regras={regrasPermitidas}
              />
              <SeletorDepartamento
                value={novoUsuarioDraft.departamentoId}
                onChange={(id) => setNovoUsuarioDraft((d) => ({ ...d, departamentoId: id }))}
                departamentos={departamentos}
                disabled={novoUsuarioDraft.regra === "ADMIN"}
              />
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" disabled={isSavingNovoUsuario} onClick={() => setIsCriando(false)}>
                  <X className="mr-1 h-4 w-4" /> Cancelar
                </Button>
                <Button size="sm" disabled={isSavingNovoUsuario} onClick={salvarNovoUsuario}>
                  {isSavingNovoUsuario ? (
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
          Criar usuário
        </Button>
      )}
    </div>
  );
}

export default UsuariosTable;
