/**
 * Tipos do banco de dados local (SQLite).
 *
 * O app é de uso local/único por organização — não depende de nenhum
 * serviço em nuvem. Os dados ficam em um arquivo SQLite (`data/painel.db`),
 * criado e migrado automaticamente em `src/core/db/client.ts`.
 */

export type RegraUsuario = "ADMIN" | "LIDER" | "MUSICOS";

/** Linha completa de `usuarios`, incluindo o hash da senha. Uso interno. */
export interface UsuarioRegistro {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  regra: RegraUsuario;
  criado_em: string;
}

/** Versão segura de `Usuario`, sem o hash da senha — a única que circula pela UI. */
export type Usuario = Omit<UsuarioRegistro, "senha_hash">;

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
}

/**
 * Linha da planilha de louvores. Representa exatamente uma linha
 * editável na tabela `louvores_planilha`.
 */
export interface LouvorPlanilha {
  id: string;
  codigo_sequencial: string; // Ex: MOC-001
  departamento_id: string;
  nome_louvor: string;
  cantor_banda: string;
  tonalidade: string; // Ex: G, Am, C#m
  link_youtube: string | null;
  ordem_execucao: number;
}

/**
 * Payload aceito ao criar uma nova linha. O código sequencial e o id
 * são derivados/gerados no servidor (ou via code-generator.ts),
 * por isso não fazem parte do input do usuário.
 */
export type NovoLouvorInput = Omit<
  LouvorPlanilha,
  "id" | "codigo_sequencial"
>;

/** Campos que podem ser editados inline na planilha. */
export type LouvorEditavel = Pick<
  LouvorPlanilha,
  "nome_louvor" | "cantor_banda" | "tonalidade" | "link_youtube" | "ordem_execucao"
>;
