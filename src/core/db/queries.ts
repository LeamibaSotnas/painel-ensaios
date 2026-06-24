import { getDb } from "@/core/db/client";
import type {
  Departamento,
  EnsaioGrade,
  LouvorEditavel,
  LouvorPlanilha,
  NovoLouvorInput,
  RegraUsuario,
  Usuario,
  UsuarioRegistro,
} from "@/types/database.types";

const SELECT_USUARIO_PUBLICO = "id, nome, email, regra, criado_em";

// ---------------------------------------------------------------------------
// usuarios
// ---------------------------------------------------------------------------

export function getUsuarioPorEmail(email: string): UsuarioRegistro | undefined {
  return getDb()
    .prepare("SELECT * FROM usuarios WHERE email = ?")
    .get(email) as UsuarioRegistro | undefined;
}

export function getUsuarioPorId(id: string): Usuario | undefined {
  return getDb()
    .prepare(`SELECT ${SELECT_USUARIO_PUBLICO} FROM usuarios WHERE id = ?`)
    .get(id) as Usuario | undefined;
}

export function listarUsuarios(): Usuario[] {
  return getDb()
    .prepare(`SELECT ${SELECT_USUARIO_PUBLICO} FROM usuarios ORDER BY nome ASC`)
    .all() as Usuario[];
}

export function emailJaExiste(email: string): boolean {
  const linha = getDb()
    .prepare("SELECT 1 FROM usuarios WHERE email = ?")
    .get(email);
  return Boolean(linha);
}

export function criarUsuario(valores: {
  nome: string;
  email: string;
  senhaHash: string;
  regra: RegraUsuario;
}): void {
  getDb()
    .prepare(
      "INSERT INTO usuarios (id, nome, email, senha_hash, regra) VALUES (?, ?, ?, ?, ?)"
    )
    .run(crypto.randomUUID(), valores.nome, valores.email, valores.senhaHash, valores.regra);
}

export function atualizarUsuario(
  id: string,
  valores: { nome: string; regra: RegraUsuario }
): void {
  getDb()
    .prepare("UPDATE usuarios SET nome = ?, regra = ? WHERE id = ?")
    .run(valores.nome, valores.regra, id);
}

export function removerUsuario(id: string): void {
  getDb().prepare("DELETE FROM usuarios WHERE id = ?").run(id);
}

// ---------------------------------------------------------------------------
// departamentos
// ---------------------------------------------------------------------------

export function listarDepartamentos(): Departamento[] {
  return getDb()
    .prepare("SELECT id, nome, slug, codigo_prefixo FROM departamentos ORDER BY nome ASC")
    .all() as Departamento[];
}

export function getDepartamentoPorSlug(slug: string): Departamento | undefined {
  return getDb()
    .prepare("SELECT id, nome, slug, codigo_prefixo FROM departamentos WHERE slug = ?")
    .get(slug) as Departamento | undefined;
}

export function slugJaExiste(slug: string, ignorarId?: string): boolean {
  const linha = ignorarId
    ? getDb()
        .prepare("SELECT 1 FROM departamentos WHERE slug = ? AND id != ?")
        .get(slug, ignorarId)
    : getDb().prepare("SELECT 1 FROM departamentos WHERE slug = ?").get(slug);
  return Boolean(linha);
}

export function codigoPrefixoJaExiste(codigoPrefixo: string, ignorarId?: string): boolean {
  const linha = ignorarId
    ? getDb()
        .prepare("SELECT 1 FROM departamentos WHERE codigo_prefixo = ? AND id != ?")
        .get(codigoPrefixo, ignorarId)
    : getDb()
        .prepare("SELECT 1 FROM departamentos WHERE codigo_prefixo = ?")
        .get(codigoPrefixo);
  return Boolean(linha);
}

export function criarDepartamento(valores: {
  nome: string;
  slug: string;
  codigoPrefixo: string;
}): Departamento {
  const id = crypto.randomUUID();
  getDb()
    .prepare(
      "INSERT INTO departamentos (id, nome, slug, codigo_prefixo) VALUES (?, ?, ?, ?)"
    )
    .run(id, valores.nome, valores.slug, valores.codigoPrefixo);
  return { id, nome: valores.nome, slug: valores.slug, codigo_prefixo: valores.codigoPrefixo };
}

export function atualizarDepartamento(
  id: string,
  valores: { nome: string; codigoPrefixo: string }
): void {
  getDb()
    .prepare("UPDATE departamentos SET nome = ?, codigo_prefixo = ? WHERE id = ?")
    .run(valores.nome, valores.codigoPrefixo, id);
}

export function removerDepartamento(id: string): void {
  getDb().prepare("DELETE FROM departamentos WHERE id = ?").run(id);
}

// ---------------------------------------------------------------------------
// ensaios_grade
// ---------------------------------------------------------------------------

export interface EnsaioGradeComDepartamento extends EnsaioGrade {
  departamento_nome: string;
  departamento_slug: string;
}

export function listarProximosEnsaios(limite = 10): EnsaioGradeComDepartamento[] {
  return getDb()
    .prepare(
      `SELECT e.id, e.data, e.hora_inicio, e.hora_fim, e.departamento_id,
              d.nome as departamento_nome, d.slug as departamento_slug
       FROM ensaios_grade e
       JOIN departamentos d ON d.id = e.departamento_id
       WHERE e.data >= date('now')
       ORDER BY e.data ASC, e.hora_inicio ASC
       LIMIT ?`
    )
    .all(limite) as EnsaioGradeComDepartamento[];
}

export function listarTodosEnsaios(): EnsaioGradeComDepartamento[] {
  return getDb()
    .prepare(
      `SELECT e.id, e.data, e.hora_inicio, e.hora_fim, e.departamento_id,
              d.nome as departamento_nome, d.slug as departamento_slug
       FROM ensaios_grade e
       JOIN departamentos d ON d.id = e.departamento_id
       ORDER BY e.data ASC, e.hora_inicio ASC`
    )
    .all() as EnsaioGradeComDepartamento[];
}

export type EnsaioEditavel = Pick<
  EnsaioGrade,
  "data" | "hora_inicio" | "hora_fim" | "departamento_id"
>;

export function criarEnsaio(valores: EnsaioEditavel): void {
  getDb()
    .prepare(
      "INSERT INTO ensaios_grade (id, data, hora_inicio, hora_fim, departamento_id) VALUES (?, ?, ?, ?, ?)"
    )
    .run(crypto.randomUUID(), valores.data, valores.hora_inicio, valores.hora_fim, valores.departamento_id);
}

export function atualizarEnsaio(id: string, valores: EnsaioEditavel): void {
  getDb()
    .prepare(
      "UPDATE ensaios_grade SET data = ?, hora_inicio = ?, hora_fim = ?, departamento_id = ? WHERE id = ?"
    )
    .run(valores.data, valores.hora_inicio, valores.hora_fim, valores.departamento_id, id);
}

export function removerEnsaio(id: string): void {
  getDb().prepare("DELETE FROM ensaios_grade WHERE id = ?").run(id);
}

// ---------------------------------------------------------------------------
// louvores_planilha
// ---------------------------------------------------------------------------

export function listarLouvoresPorDepartamento(departamentoId: string): LouvorPlanilha[] {
  return getDb()
    .prepare(
      "SELECT * FROM louvores_planilha WHERE departamento_id = ? ORDER BY ordem_execucao ASC"
    )
    .all(departamentoId) as LouvorPlanilha[];
}

export function listarCodigosPorDepartamento(departamentoId: string): string[] {
  const linhas = getDb()
    .prepare("SELECT codigo_sequencial FROM louvores_planilha WHERE departamento_id = ?")
    .all(departamentoId) as { codigo_sequencial: string }[];
  return linhas.map((linha) => linha.codigo_sequencial);
}

export function criarLouvor(valores: NovoLouvorInput, codigoSequencial: string): void {
  getDb()
    .prepare(
      `INSERT INTO louvores_planilha
        (id, codigo_sequencial, departamento_id, nome_louvor, cantor_banda, tonalidade, link_youtube, ordem_execucao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      crypto.randomUUID(),
      codigoSequencial,
      valores.departamento_id,
      valores.nome_louvor,
      valores.cantor_banda,
      valores.tonalidade,
      valores.link_youtube,
      valores.ordem_execucao
    );
}

export function atualizarLouvor(id: string, valores: Partial<LouvorEditavel>): void {
  const campos = Object.keys(valores) as (keyof LouvorEditavel)[];
  if (campos.length === 0) return;

  const colunas = campos.map((campo) => `${campo} = ?`).join(", ");
  const valoresOrdenados = campos.map((campo) => valores[campo]);

  getDb()
    .prepare(`UPDATE louvores_planilha SET ${colunas} WHERE id = ?`)
    .run(...valoresOrdenados, id);
}

export function removerLouvor(id: string): void {
  getDb().prepare("DELETE FROM louvores_planilha WHERE id = ?").run(id);
}

export function listarOrdemPorDepartamento(
  departamentoId: string
): { id: string; ordem_execucao: number }[] {
  return getDb()
    .prepare(
      "SELECT id, ordem_execucao FROM louvores_planilha WHERE departamento_id = ? ORDER BY ordem_execucao ASC"
    )
    .all(departamentoId) as { id: string; ordem_execucao: number }[];
}

export function definirOrdemExecucao(id: string, ordemExecucao: number): void {
  getDb()
    .prepare("UPDATE louvores_planilha SET ordem_execucao = ? WHERE id = ?")
    .run(ordemExecucao, id);
}
