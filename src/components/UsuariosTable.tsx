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
import type { RegraUsuario, Usuario } from "@/types/database.types";

export type UsuarioEditavel = Pick<Usuario, "nome" | "regra">;

export interface NovoUsuarioInput {
  nome: string;
  email: string;
  senha: string;
  regra: RegraUsuario;
}

export interface UsuariosTableProps {
  data: Usuario[];
  /** id do usuário logado — evita que ele remova/rebaixe a própria conta. */
  usuarioAtualId: string;
  onAtualizarUsuario: (id: string, valores: UsuarioEditavel) => Promise<void>;
  onRemoverUsuario: (id: string) => Promise<void>;
  onCriarUsuario: (valores: NovoUsuarioInput) => Promise<void>;
}

const REGRAS: RegraUsuario[] = ["ADMIN", "LIDER", "MUSICOS"];

const VARIANTE_BADGE_REGRA: Record<RegraUsuario, "default" | "secondary" | "outline"> = {
  ADMIN: "default",
  LIDER: "secondary",
  MUSICOS: "outline",
};

function SeletorRegra({
  value,
  onChange,
}: {
  value: RegraUsuario;
  onChange: (regra: RegraUsuario) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as RegraUsuario)}
      className="h-8 w-32 rounded-md border border-input bg-background px-2 text-sm"
    >
      {REGRAS.map((regra) => (
        <option key={regra} value={regra}>
          {regra}
        </option>
      ))}
    </select>
  );
}

export function UsuariosTable({
  data,
  usuarioAtualId,
  onAtualizarUsuario,
  onRemoverUsuario,
  onCriarUsuario,
}: UsuariosTableProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<UsuarioEditavel>({
    nome: "",
    regra: "MUSICOS",
  });
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [isCriando, setIsCriando] = React.useState(false);
  const [novoUsuarioDraft, setNovoUsuarioDraft] = React.useState<NovoUsuarioInput>({
    nome: "",
    email: "",
    senha: "",
    regra: "MUSICOS",
  });
  const [isSavingNovoUsuario, setIsSavingNovoUsuario] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  function iniciarEdicao(usuario: Usuario) {
    setErro(null);
    setEditingId(usuario.id);
    setDraft({ nome: usuario.nome, regra: usuario.regra });
  }

  function cancelarEdicao() {
    setEditingId(null);
  }

  async function salvarEdicao(id: string) {
    setSavingId(id);
    setErro(null);
    try {
      await onAtualizarUsuario(id, draft);
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
    setIsSavingNovoUsuario(true);
    setErro(null);
    try {
      await onCriarUsuario({
        nome: novoUsuarioDraft.nome.trim(),
        email: novoUsuarioDraft.email.trim(),
        senha: novoUsuarioDraft.senha,
        regra: novoUsuarioDraft.regra,
      });
      setIsCriando(false);
      setNovoUsuarioDraft({ nome: "", email: "", senha: "", regra: "MUSICOS" });
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

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Senha</TableHead>
              <TableHead>Regra</TableHead>
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
                      />
                    ) : (
                      <Badge variant={VARIANTE_BADGE_REGRA[usuario.regra]}>
                        {usuario.regra}
                      </Badge>
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
