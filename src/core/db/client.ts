import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

import { hashSenha } from "@/core/auth/password";

/**
 * Banco local em arquivo único (SQLite) — não depende de nenhuma conta
 * ou serviço em nuvem. Ideal para uso interno de uma única organização.
 */
const CAMINHO_DB = path.join(process.cwd(), "data", "painel.db");

let instancia: Database.Database | null = null;

function criarEsquema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      regra TEXT NOT NULL CHECK (regra IN ('ADMIN', 'LIDER', 'MUSICOS')),
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS departamentos (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      codigo_prefixo TEXT NOT NULL UNIQUE,
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ensaios_grade (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      hora_inicio TEXT NOT NULL,
      hora_fim TEXT NOT NULL,
      departamento_id TEXT NOT NULL REFERENCES departamentos (id) ON DELETE CASCADE,
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_ensaios_grade_data ON ensaios_grade (data);
    CREATE INDEX IF NOT EXISTS idx_ensaios_grade_departamento ON ensaios_grade (departamento_id);

    CREATE TABLE IF NOT EXISTS louvores_planilha (
      id TEXT PRIMARY KEY,
      codigo_sequencial TEXT NOT NULL,
      departamento_id TEXT NOT NULL REFERENCES departamentos (id) ON DELETE CASCADE,
      nome_louvor TEXT NOT NULL,
      cantor_banda TEXT NOT NULL DEFAULT '',
      tonalidade TEXT NOT NULL DEFAULT '',
      link_youtube TEXT,
      ordem_execucao INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (departamento_id, codigo_sequencial)
    );

    CREATE INDEX IF NOT EXISTS idx_louvores_departamento ON louvores_planilha (departamento_id);
    CREATE INDEX IF NOT EXISTS idx_louvores_ordem ON louvores_planilha (departamento_id, ordem_execucao);
  `);
}

function semearDepartamentosPadrao(db: Database.Database) {
  const existentes = db
    .prepare("SELECT COUNT(*) as total FROM departamentos")
    .get() as { total: number };

  if (existentes.total > 0) return;

  const inserir = db.prepare(
    "INSERT INTO departamentos (id, nome, slug, codigo_prefixo) VALUES (?, ?, ?, ?)"
  );

  const padrao = [
    { nome: "Jovens", slug: "jovens", codigo_prefixo: "SA" },
    { nome: "Adolescentes", slug: "adolescentes", codigo_prefixo: "AD" },
    { nome: "Crianças", slug: "criancas", codigo_prefixo: "JD" },
    { nome: "Irmãs", slug: "irmas", codigo_prefixo: "RS" },
  ];

  for (const dep of padrao) {
    inserir.run(crypto.randomUUID(), dep.nome, dep.slug, dep.codigo_prefixo);
  }
}

function semearAdminPadrao(db: Database.Database) {
  const existentes = db
    .prepare("SELECT COUNT(*) as total FROM usuarios")
    .get() as { total: number };

  if (existentes.total > 0) return;

  const emailPadrao = process.env.ADMIN_PADRAO_EMAIL ?? "admin@local.app";
  const senhaPadrao = process.env.ADMIN_PADRAO_SENHA ?? "admin123";

  db.prepare(
    "INSERT INTO usuarios (id, nome, email, senha_hash, regra) VALUES (?, ?, ?, ?, 'ADMIN')"
  ).run(crypto.randomUUID(), "Administrador", emailPadrao, hashSenha(senhaPadrao));

  // eslint-disable-next-line no-console
  console.log(
    `[painel] Usuário ADMIN padrão criado: ${emailPadrao} / ${senhaPadrao} — troque a senha depois do primeiro login.`
  );
}

export function getDb(): Database.Database {
  if (instancia) return instancia;

  try {
    fs.mkdirSync(path.dirname(CAMINHO_DB), { recursive: true });

    const db = new Database(CAMINHO_DB);

    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    criarEsquema(db);
    semearDepartamentosPadrao(db);
    semearAdminPadrao(db);

    instancia = db;

    return db;
  } catch (erro) {
    console.error("[ERRO SQLITE]", erro);
    throw erro;
  }
}