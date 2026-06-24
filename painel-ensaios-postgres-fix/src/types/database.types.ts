/**
 * Tipos do banco de dados (Postgres na nuvem, via @vercel/postgres).
 *
 * O banco fica hospedado na nuvem (Vercel Postgres / Neon), compartilhado
 * por todos os usuários do app — schema, migrações de coluna e seed inicial
 * são criados e aplicados automaticamente em `src/core/db/client.ts`.
 */

export type RegraUsuario = "ADMIN" | "LIDER" | "MUSICOS";

/** Linha completa de `usuarios`, incluindo o hash da senha. Uso interno. */
export interface UsuarioRegistro {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  regra: RegraUsuario;
  /** Departamento ao qual o usuário pertence. `null` para ADMIN (acesso a todos). */
  departamento_id: string | null;
  criado_em: string;
}

/** Versão segura de `Usuario`, sem o hash da senha — a única que circula pela UI. */
export type Usuario = Omit<UsuarioRegistro, "senha_hash">;

/** `Usuario` com o nome/slug do departamento já resolvidos, para exibição em listas. */
export interface UsuarioComDepartamento extends Usuario {
  departamento_nome: string | null;
}

export interface Departamento {
  id: string;
  nome: string;
  slug: string;
  codigo_prefixo: string;
}

export interface EnsaioGrade {
  id: string;
  data: string; // ISO date (YYYY-MM-DD)
  hora_inicio: string; // HH:mm
  hora_fim: string; // HH:mm
  departamento_id: string;
  local: string;
  responsavel: string;
  observacoes: string;
}

export type EnsaioEditavel = Pick<
  EnsaioGrade,
  "data" | "hora_inicio" | "hora_fim" | "departamento_id" | "local" | "responsavel" | "observacoes"
>;

/** `EnsaioGrade` com o nome/slug do departamento já resolvidos, para exibição em listas. */
export interface EnsaioGradeComDepartamento extends EnsaioGrade {
  departamento_nome: string;
  departamento_slug: string;
}

/**
 * Linha da planilha de louvores. Representa exatamente uma linha
 * edit