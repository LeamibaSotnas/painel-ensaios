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
      regra TEXT NOT NULL CHECK (regra IN ('ADMIN', 'ADMIN_PAINEL', 'LIDER', 'MUSICOS')),
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
      youtube_canal TEXT,
      cifra TEXT NOT NULL DEFAULT '',
      observacoes TEXT NOT NULL DEFAULT '',
      favorito BOOLEAN NOT NULL DEFAULT false,
      ultima_execucao TEXT,
      vezes_executado INTEGER NOT NULL DEFAULT 0,
      ordem_execucao INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL DEFAULT now()::text,
      atualizado_em TEXT NOT NULL DEFAULT now()::text,
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
/**
 * Executa uma migração silenciosamente: nunca propaga erro.
 * Usa closure para garantir que `sql` seja chamado como tagged template
 * de verdade (não como função regular) — compatível com @vercel/postgres.
 */
async function m(fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch {
    // Silencia: coluna/tabela já existente, constraint duplicada, etc.
  }
}

async function aplicarMigracoesDeColunas() {
  // ── Colunas legadas (fase 1) ──────────────────────────────────────────────
  await m(() => sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS departamento_id TEXT REFERENCES departamentos (id) ON DELETE SET NULL`);
  await m(() => sql`ALTER TABLE louvores_planilha ADD COLUMN IF NOT EXISTS youtube_titulo TEXT`);
  await m(() => sql`ALTER TABLE louvores_planilha ADD COLUMN IF NOT EXISTS youtube_thumbnail TEXT`);
  await m(() => sql`ALTER TABLE louvores_planilha ADD COLUMN IF NOT EXISTS cifra TEXT NOT NULL DEFAULT ''`);
  await m(() => sql`ALTER TABLE louvores_planilha ADD COLUMN IF NOT EXISTS observacoes TEXT NOT NULL DEFAULT ''`);
  await m(() => sql`ALTER TABLE louvores_planilha ADD COLUMN IF NOT EXISTS favorito BOOLEAN NOT NULL DEFAULT false`);
  await m(() => sql`ALTER TABLE louvores_planilha ADD COLUMN IF NOT EXISTS ultima_execucao TEXT`);
  await m(() => sql`ALTER TABLE louvores_planilha ADD COLUMN IF NOT EXISTS youtube_canal TEXT`);
  await m(() => sql`ALTER TABLE louvores_planilha ADD COLUMN IF NOT EXISTS vezes_executado INTEGER NOT NULL DEFAULT 0`);
  await m(() => sql`ALTER TABLE louvores_planilha ADD COLUMN IF NOT EXISTS atualizado_em TEXT NOT NULL DEFAULT now()::text`);
  await m(() => sql`ALTER TABLE ensaios_grade ADD COLUMN IF NOT EXISTS local TEXT NOT NULL DEFAULT ''`);
  await m(() => sql`ALTER TABLE ensaios_grade ADD COLUMN IF NOT EXISTS responsavel TEXT NOT NULL DEFAULT ''`);
  await m(() => sql`ALTER TABLE ensaios_grade ADD COLUMN IF NOT EXISTS observacoes TEXT NOT NULL DEFAULT ''`);

  // ── Colunas fase 2 (tipo_louvor / evento_nome) ────────────────────────────
  await m(() => sql`ALTER TABLE louvores_planilha ADD COLUMN IF NOT EXISTS tipo_louvor TEXT`);
  await m(() => sql`ALTER TABLE louvores_planilha ADD COLUMN IF NOT EXISTS evento_nome TEXT`);

  // ── Tabela de mural (fase 2) ──────────────────────────────────────────────
  await m(() => sql`
    CREATE TABLE IF NOT EXISTS observacoes_mural (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      descricao TEXT NOT NULL DEFAULT '',
      autor_nome TEXT NOT NULL,
      autor_id TEXT NOT NULL,
      departamento_id TEXT REFERENCES departamentos (id) ON DELETE CASCADE,
      prioridade TEXT NOT NULL DEFAULT 'NORMAL',
      categoria TEXT NOT NULL DEFAULT 'AVISO',
      status TEXT NOT NULL DEFAULT 'ATIVA',
      criado_em TEXT NOT NULL DEFAULT now()::text,
      atualizado_em TEXT NOT NULL DEFAULT now()::text
    )
  `);
  await m(() => sql`CREATE INDEX IF NOT EXISTS idx_observacoes_dept ON observacoes_mural (departamento_id)`);
  await m(() => sql`CREATE INDEX IF NOT EXISTS idx_observacoes_status ON observacoes_mural (status)`);
  await m(() => sql`CREATE INDEX IF NOT EXISTS idx_observacoes_criado ON observacoes_mural (criado_em)`);

  // ── Constraint ADMIN_PAINEL (fase 1 RBAC) ────────────────────────────────
  await m(() => sql`ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_regra_check`);
  await m(() => sql`
    ALTER TABLE usuarios
      ADD CONSTRAINT usuarios_regra_check
      CHECK (regra IN ('ADMIN', 'ADMIN_PAINEL', 'LIDER', 'MUSICOS'))
  `);
}

async function semearDepartamentosPadrao() {
  const { rows } = await sql<{ total: number }>`SELECT COUNT(*)::int as total FROM departamentos`;
  if (rows[0]?.total > 0) return;

  const padroes = [
    { nome: "SOM DE ADORADORES",  slug: "som-de-adoradores",  codigo_prefixo: "SA" },
    { nome: "HERÓIS DA FÉ",       slug: "herois-da-fe",        codigo_prefixo: "AD" },
    { nome: "JARDIM DE DEUS",     slug: "jardim-de-deus",      codigo_prefixo: "JD" },
    { nome: "ROSA DE SARON",      slug: "rosa-de-saron",       codigo_prefixo: "RS" },
    { nome: "SHEKNA",             slug: "shekna",              codigo_prefixo: "SK" },
    { nome: "FRUTOS DA PROMESSA", slug: "frutos-da-promessa",  codigo_prefixo: "FP" },
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

/**
 * Renomeia os departamentos que ainda têm os nomes legados (antes do lançamento oficial).
 * Idempotente: só age nas linhas que correspondam ao slug antigo.
 */
async function renomearDepartamentosLegados() {
  const renames = [
    { slug_antigo: "jovens",       nome_novo: "SOM DE ADORADORES",  slug_novo: "som-de-adoradores"  },
    { slug_antigo: "adolescentes", nome_novo: "HEROIS DA FE",       slug_novo: "herois-da-fe"        },
    { slug_antigo: "criancas",     nome_novo: "JARDIM DE DEUS",     slug_novo: "jardim-de-deus"      },
    { slug_antigo: "irmas",        nome_novo: "ROSA DE SARON",      slug_novo: "rosa-de-saron"       },
    { slug_antigo: "orquestra",    nome_novo: "SHEKNA",             slug_novo: "shekna"              },
    { slug_antigo: "banda",        nome_novo: "FRUTOS DA PROMESSA", slug_novo: "frutos-da-promessa"  },
  ];
  for (const r of renames) {
    await sql`
      UPDATE departamentos
      SET nome = ${r.nome_novo}, slug = ${r.slug_novo}
      WHERE slug = ${r.slug_antigo}
    `;
  }
}

async function inicializarBanco() {
  await criarEsquema();
  await aplicarMigracoesDeColunas();
  await renomearDepartamentosLegados();
  await semearDepartamentosPadrao();
  await semearAdminPadrao();
}

let esquemaProntoPromise: Promise<void> | null = null;

/**
 * Garante que o schema/seed já foi aplicado e retorna o cliente `sql`.
 * Se a inicialização falhar, a promise é descartada para que a próxima
 * requisição tente novamente (evita cachear um estado de erro permanente).
 */
export async function getDb() {
  if (!esquemaProntoPromise) {
    esquemaProntoPromise = inicializarBanco().catch((err) => {
      esquemaProntoPromise = null; // permite retry na próxima requisição
      throw err;
    });
  }
  await esquemaProntoPromise;
  return sql;
}
