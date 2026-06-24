import { sql } from "@vercel/postgres";

import { hashSenha } from "@/core/auth/password";

/**
 * Banco Postgres na nuvem (Vercel Postgres / Neon) — assim, qualquer pessoa
 * pode acessar o painel pela internet, de qualquer lugar, todos vendo o
 * mesmo banco. A conexão é lida automaticamente de `process.env.POSTGRES_URL`
 * (injetada pela Vercel quando você conecta um banco Postgres ao projeto).
 */

async function criarEsquema() {
  await sql`
    CREATE TABLE IF NOT EXISTS departamentos (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      codigo_prefixo TEXT NOT NULL UNIQUE,
      criado_em TEXT NOT NULL DEFAULT now()::text
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      regra TEXT NOT NULL CHECK (regra IN ('ADMIN', 'LIDER', 'MUSICOS')),
      departamento_id TEXT REFERENCES departamentos (id) ON DELETE SET NULL,
      criado_em TEXT NOT NULL DEFAULT now()::text
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ensaios_grade (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      hora_inicio TEXT NOT NULL,
      hora_fim TEXT NOT NULL,
      departamento_id TEXT NOT NULL REFERENCES departamentos (id) ON DELETE CASCADE,
      local TEXT NOT NULL DEFAULT '',
      responsavel TEXT NOT NULL DEFAULT '',
      observacoes TEXT NOT NULL DEFAULT '',
      criado_em TEXT NOT NULL DEFAULT now()::text
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_ensaios_grade_data ON ensaios_grade (data);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ensaios_grade_departamento ON ensaios_grade (departamento_id);`;

  await sql`
    CREATE TABLE IF NOT EXISTS louvores_planilha (
      id TEXT PRIMARY KEY,
      codigo_sequencial TEXT NOT NULL,
      departamento_id TEXT NOT NULL REFERENCES departamentos (id) ON DELETE CASCADE,
      nome_louvor TEXT NOT NULL,
      cantor_banda TEXT NOT NULL DEFAULT '',
      tonalidade TEXT NOT NULL DEFAULT '',
      link_youtube TEXT,
      youtube_titulo TEXT,
      youtube_thumbnail TEXT,
      cifra TEXT NOT NULL DEFAULT '',
      observacoes TEXT NOT NULL DEFAULT '',
      favorito BOOLEAN NOT NULL DEFAULT false,
      ultima_execucao TEXT,
      ordem_execucao INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL DEFAULT now()::text,
      UNIQUE (departamento_id, codigo_sequencial)
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_louvores_departamento ON louvores_planilha (departamento_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_louvores_ordem ON louvores_planilha (departamento_id, ordem_execucao);`;
}

/**
 * Colunas que podem estar ausentes em um banco criado por uma versão
 * anterior do app. O Postgres já suporta `ADD COLUMN IF NOT EXISTS`
 * nativamente — instalações existentes recebem os novos campos
 * automaticamente, sem perder dados.
 */
async function aplicarMigracoesDeColunas() {
  await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS departamento_id TEXT REFERENCES departamentos (id) ON DELETE SET NULL;`;
  await sql`ALTER TABLE louvores_planilha ADD COLUMN IF NOT EXISTS youtube_titulo TEXT;`;
  await sql`ALTER TABLE louvores_planilha ADD COLUMN IF NOT EXISTS youtube_thumbnail TEXT;`;
  await sql`ALTER TABLE louvores_planilha ADD COLUMN IF NOT EXISTS cifra TEXT NOT NULL DEFAULT '';`;
  await sql`ALTER TABLE louvores_planilha ADD COLUMN IF NOT EXISTS observacoes TEXT NOT NULL DEFAULT '';`;
  await sql`ALTER TABLE louvores_planilha ADD COLUMN IF NOT EXISTS favorito BOOLEAN NOT NULL DEFAULT false;`;
  await sql`ALTER TABLE louvores_planilha ADD COLUMN IF NOT EXISTS ultima_execucao TEXT;`;
  await sql`ALTER TABLE ensaios_grade ADD COLUMN IF NOT EXISTS local TEXT NOT NULL DEFAULT '';`;
  await sql`ALTER TABLE ensaios_grade ADD COLUMN IF NOT EXISTS responsavel TEXT NOT NULL DEFAULT '';`;
  await sql`ALTER TABLE ensaios_grade ADD COLUMN IF NOT EXISTS observacoes TEXT NOT NULL DEFAULT '';`;
}

async function semearDepartamentosPadrao() {
  const { rows } = await sql<{ total: number }>`SELECT COUNT(*)::int as total FROM departamentos`;
  if (rows[0]?.total > 0) return;

  const padroes = [
    { nome: "Jovens", slug: "jovens", codigo_prefixo: "SA" },
    { nome: "Adolescentes", slug: "adolescentes", codigo_prefixo: "AD" },
    { nome: "Crianças", slug: "criancas", codigo_prefixo: "JD" },
    { nome: "Irmãs", slug: "irmas", codigo_prefixo: "RS" },
  ];

  for (const dep of padroes) {
    await sql`
      INSERT INTO departamentos (id, nome, slug, codigo_prefixo)
      VALUES (${crypto.randomUUID()}, ${dep.nome}, ${dep.slug}, ${dep.codigo_prefixo})
      ON CONFLICT (slug) DO NOTHING
    `;
  }
}

async function semearAdminPadrao() {
  const { rows } = await sql<{ total: number }>`SELECT COUNT(*)::int as total FROM usuarios`;
  if (rows[0]?.total > 0) return;

  const email = process.env.ADMIN_PADRAO_EMAIL ?? "admin@local.app";
  const senha = process.env.ADMIN_PADRAO_SENHA ?? "admin123";
  const senhaHash = hashSenha(senha);

  await sql`
    INSERT INTO usuarios (id, nome, email, senha_hash, regra, departamento_id)
    VALUES (${crypto.randomUUID()}, 'Administrador', ${email}, ${senhaHash}, 'ADMIN', NULL)
    ON CONFLICT (email) DO NOTHING
  `;
}

async function inicializarBanco() {
  await criarEsquema();
  await aplicarMigracoesDeColunas();
  await semearDepartamentosPadrao();
  await semearAdminPadrao();
}

let esquemaProntoPromise: Promise<void> | null = null;

/** Garante que o schema/seed já foi aplicado e retorna o cliente `sql` do @vercel/postgres. */
export async function getDb() {
  if (!esquemaProntoPromise) {
    esquemaProntoPromise = inicializarBanco();
  }
  await esquemaProntoPromise;
  return sql;
}
