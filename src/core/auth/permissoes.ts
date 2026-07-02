/**
 * Helpers centralizados de RBAC (controle de acesso por papel).
 *
 * Papéis existentes:
 * - ADMIN          → Super Administrador: controle total, todos os departamentos.
 * - ADMIN_PAINEL   → Admin comum: vê TODOS os departamentos (somente leitura —
 *                     abre links, consulta tudo), mas NÃO pode modificar nada.
 * - LIDER          → Gerencia repertório/ensaios apenas do próprio departamento.
 * - MUSICOS        → Membro: visualiza e abre links apenas do próprio departamento.
 *
 * Centralizar essas checagens aqui evita duplicar `usuario.regra === "ADMIN"`
 * espalhado pelas páginas e facilita manter a regra de negócio consistente.
 */
import type { RegraUsuario } from "@/types/database.types";

type UsuarioComRegra = { regra: RegraUsuario; departamento_id?: string | null } | null | undefined;

/** Super Administrador — controle total do sistema. */
export function ehSuperAdmin(usuario: UsuarioComRegra): boolean {
  return usuario?.regra === "ADMIN";
}

/** Admin comum — vê todos os grupos mas não pode modificar nada. */
export function ehAdminDePainel(usuario: UsuarioComRegra): boolean {
  return usuario?.regra === "ADMIN_PAINEL";
}

/** Algum tipo de administrador (Super ou comum). */
export function ehAdmin(usuario: UsuarioComRegra): boolean {
  return ehSuperAdmin(usuario) || ehAdminDePainel(usuario);
}

/**
 * Pode visualizar o departamento informado.
 * - Super Admin e Admin comum → vêem todos.
 * - Líder e Membro → só o próprio.
 */
export function podeVerDepartamento(usuario: UsuarioComRegra, departamentoId: string): boolean {
  if (!usuario) return false;
  if (ehSuperAdmin(usuario) || ehAdminDePainel(usuario)) return true;
  return usuario.departamento_id === departamentoId;
}

/**
 * Pode editar/gerenciar o repertório do departamento informado.
 * - Super Admin → todos.
 * - Líder → só o próprio.
 * - Admin comum e Membro → NUNCA (somente leitura).
 */
export function podeEditarDepartamento(usuario: UsuarioComRegra, departamentoId: string): boolean {
  if (!usuario) return false;
  if (ehSuperAdmin(usuario)) return true;
  if (usuario.regra === "LIDER") {
    return usuario.departamento_id === departamentoId;
  }
  return false;
}

/**
 * Pode acessar a tela de gestão de usuários.
 * Exclusivo do Super Administrador — Admin comum não gerencia usuários.
 */
export function podeGerenciarUsuarios(usuario: UsuarioComRegra): boolean {
  return ehSuperAdmin(usuario);
}

/** Pode criar/editar/excluir departamentos — exclusivo do Super Administrador. */
export function podeGerenciarDepartamentos(usuario: UsuarioComRegra): boolean {
  return ehSuperAdmin(usuario);
}

/** Quais papéis um usuário pode atribuir a outro (ao criar ou editar uma conta). */
export function regrasAtribuiveis(usuario: UsuarioComRegra): RegraUsuario[] {
  if (ehSuperAdmin(usuario)) return ["ADMIN", "ADMIN_PAINEL", "LIDER", "MUSICOS"];
  return [];
}
