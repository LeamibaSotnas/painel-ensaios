import { getDb } from "@/core/db/client";
import type {
  Departamento,
  EnsaioEditavel,
  EnsaioGradeComDepartamento,
  LouvorDetalhesEditavel,
  LouvorEditavel,
  LouvorPlanilha,
  NovoLouvorInput,
  RegraUsuario,
  Usuario,
  UsuarioComDepartamento,
  UsuarioRegistro,
} from "@/types/database.types";

// ---------------------------------------------------------------------------
// usuarios
// ---------------------------------------------------------------------------

export async function getUsuarioPorEmail(email: string): Promise<UsuarioRegistro | undefined> {
  const db = await getDb();
  const { rows } = await db<UsuarioRegistro>`SELECT * FROM usuarios WHERE email = ${email}`;
  return rows[0];
}

export async function getUsuarioPorId(id: string): Promise<Usuario | undefined> {
  const db = await getDb();
  const { rows } = await db<Usuario>`
    SELECT id, nome, email, regra, departamento_id, criado_em FROM usuarios WHERE id = ${id}
  `;
  return rows[0];
}

export async function listarUsuarios(): Promise<UsuarioComDepartamento[]> {
  const db = await getDb();
  const { rows } = await db<UsuarioComDepartamento>`
    SELECT u.id, u.nome, u.email, u.regra, u.departamento_id, u.criado_em,
           d.nome as departamento_nome
    FROM usuarios u
    LEFT JOIN departamentos d ON d.id = u.departamento_id
    ORDER BY u.nome ASC
  `;
  return rows;
}

export async function emailJaExiste(email: string): Promise<boolean> {
  const db = await getDb();
  const { rows } = await db`SELECT 1 FROM usuarios WHERE email = ${email}`;
  return rows.length > 0;
}

export async function criarUsuario(valores: {
  nome: string;
  email: string;
  senhaHash: string;
  regra: RegraUsuario;
  departamentoId: string | null;
}): Promise<void> {
  const db = await getDb();
  await db`
    INSERT INTO usuarios (id, nome, email, senha_hash, regra, departamento_id)
    VALUES (${crypto.randomUUID()}, ${valores.nome}, ${valores.email}, ${valores.senhaHash}, ${valores.regra}, ${valores.departamentoId})
  `;
}

export async function atualizarUsuario(
  id: string,
  valores: { nome: string; regra: RegraUsuario; departamentoId: string | null }
): Promise<void> {
  const db = await getDb();
  await db`
    UPDATE usuarios SET nome = ${valores.nome}, regra = ${valores.regra}, departamento_id = ${valores.departamentoId}
    WHERE id = ${id}
  `;
}

export async function removerUsuario(id: string): Promise<void> {
  const db = await getDb();
  await db`DELETE FROM usuarios WHERE id = ${id}`;
}

// ---------------------------------------------------------------------------
// departamentos
// ---------------------------------------------------------------------------

export async function listarDepartamentos(): Promise<Departamento[]> {
  const db = await getDb();
  const { rows } = await db<Departamento>`
    SELECT id, nome, slug, codigo_prefixo FROM departamentos ORDER BY nome ASC
  `;
  return rows;
}

export async function getDepartamentoPorSlug(slug: string): Promise<Departamento | undefined> {
  const db = await getDb();
  const { rows } = await db<Departamento>`
    SELECT id, nome, slug, codigo_prefixo FROM departamentos WHERE slug = ${slug}
  `;
  return rows[0];
}

export async function getDepartamentoPorId(id: string): Promise<Departamento | undefined> {
  const db = await getDb();
  const { rows } = await db<Departamento>`
    SELECT id, nome, slug, codigo_prefixo FROM departamentos WHERE id = ${id}
  `;
  return rows[0];
}

export async function slugJaExiste(slug: string, ignorarId?: string): Promise<boolean> {
  const db = await getDb();
  const { rows } = ignorarId
    ? await db`SELECT 1 FROM departamentos WHERE slug = ${slug} AND id != ${ignorarId}`
    : await db`SELECT 1 FROM departamentos WHERE slug = ${slug}`;
  return rows.length > 0;
}

export async function codigoPrefixoJaExiste(
  codigoPrefixo: string,
  ignorarId?: string
): Promise<boolean> {
  const db = await getDb();
  const { rows } = ignorarId
    ? await db`SELECT 1 FROM departamentos WHERE codigo_prefixo = ${codigoPrefixo} AND id != ${ignorarId}`
    : await db`SELECT 1 FROM departamentos WHERE codigo_prefixo = ${codigoPrefixo}`;
  return rows.length > 0;
}

export async function criarDepartamento(valores: {
  nome: string;
  slug: string;
  codigoPrefixo: string;
}): Promise<Departamento> {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db`
    INSERT INTO departamentos (id, nome, slug, codigo_prefixo)
    VALUES (${id}, ${valores.nome}, ${valores.slug}, ${valores.codigoPrefixo})
  `;
  return { id, nome: valores.nome, slug: valores.slug, codigo_prefixo: valores.codigoPrefixo };
}

export async function atualizarDepartamento(
  id: string,
  valores: { nome: string; codigoPrefixo: string }
): Promise<void> {
  const db = await getDb();
  await db`
    UPDATE departamentos SET nome = ${valores.nome}, codigo_prefixo = ${valores.codigoPrefixo}
    WHERE id = ${id}
  `;
}

export async function removerDepartamento(id: string): Promise<void> {
  const db = await getDb();
  await db`DELETE FROM departamentos WHERE id = ${id}`;
}

// ---------------------------------------------------------------------------
// ensaios_grade
// ---------------------------------------------------------------------------

export async function listarProximosEnsaios(
  limite = 10,
  departamentoId?: string
): Promise<EnsaioGradeComDepartamento[]> {
  const db = await getDb();
  const { rows } = departamentoId
    ? await db<EnsaioGradeComDepartamento>`
        SELECT e.id, e.data, e.hora_inicio, e.hora_fim, e.departamento_id,
               e.local, e.responsavel, e.observacoes,
               d.nome as departamento_nome, d.slug as departamento_slug
        FROM ensaios_grade e
        JOIN departamentos d ON d.id = e.departamento_id
        WHERE e.data >= CURRENT_DATE::text AND e.departamento_id = ${departamentoId}
        ORDER BY e.data ASC, e.hora_inicio ASC
        LIMIT ${limite}
      `
    : await db<EnsaioGradeComDepartamento>`
        SELECT e.id, e.data, e.hora_inicio, e.hora_fim, e.departamento_id,
               e.local, e.responsavel, e.observacoes,
               d.nome as departamento_nome, d.slug as departamento_slug
        FROM ensaios_grade e
        JOIN departamentos d ON d.id = e.departamento_id
        WHERE e.data >= CURRENT_DATE::text
        ORDER BY e.data ASC, e.hora_inicio ASC
        LIMIT ${limite}
      `;
  return rows;
}

export async function listarTodosEnsaios(
  departamentoId?: string
): Promise<EnsaioGradeComDepartamento[]> {
  const db = await getDb();
  const { rows } = departamentoId
    ? await db<EnsaioGradeComDepartamento>`
        SELECT e.id, e.data, e.hora_inicio, e.hora_fim, e.departamento_id,
               e.local, e.responsavel, e.observacoes,
               d.nome as departamento_nome, d.slug as departamento_slug
        FROM ensaios_grade e
        JOIN departamentos d ON d.id = e.departamento_id
        WHERE e.departamento_id = ${departamentoId}
        ORDER BY e.data ASC, e.ho