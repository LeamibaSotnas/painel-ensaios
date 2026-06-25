/**
 * Helpers centralizados de RBAC (controle de acesso por papel).
 *
 * Papéis existentes:
 * - ADMIN          → Super Administrador: controle total, todos os departamentos.
 * - ADMIN_PAINEL   → Administrador de Painel: controla apenas o próprio departamento
 *                     (usuários e repertório locais); não vê nem afeta outros departamentos.
 * - LIDER          → gerencia repertório/ensaios do próprio departamento.
 * - MUSICOS        → Membro: apenas visualiza/atualiza informações autorizadas.
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

/** Administrador de Painel — controla apenas o próprio departamento. */
export function ehAdminDePainel(usuario: UsuarioComRegra): boolean {
  return usuario?.regra === "ADMIN_PAINEL";
}

/** Algum tipo de administrador, seja global (Super Admin) ou só do próprio painel. */
export function ehAdmin(usuario: UsuarioComRegra): boolean {
  return ehSuperAdmin(usuario) || ehAdminDePainel(usuario);
}

/** Pode visualizar o departamento informado (Super Admin vê todos; demais só o próprio). */
export function podeVerDepartamento(usuario: UsuarioComRegra, departamentoId: string): boolean {
  if (!usuario) return false;
  if (ehSuperAdmin(usuario)) return true;
  return usuario.departamento_id === departamentoId;
}

/** Pode editar/gerenciar o repertório/ensaios do departamento informado. */
export function podeEditarDepartamento(usuario: UsuarioComRegra, departamentoId: string): boolean {
  if (!usuario) return false;
  if (ehSuperAdmin(usuario)) return true;
  if (usuario.regra === "LIDER" || usuario.regra === "ADMIN_PAINEL") {
    return usuario.departamento_id === departamentoId;
  }
  return false;
}

/** Pode acessar a tela de gestão de usuários (globalmente ou restrito ao próprio departamento). */
export function podeGerenciarUsuarios(usuario: UsuarioComRegra): boolean {
  return ehAdmin(usuario);
}

/** Pode criar/editar/excluir departamentos — exclusivo do Super Administrador. */
export function podeGerenciarDepartamentos(usuario: UsuarioComRegra): boolean {
  return ehSuperAdmin(usuario);
}

/** Quais papéis um usuário pode atribuir a outro (ao criar ou editar uma conta). */
export function regrasAtribuiveis(usuario: UsuarioComRegra): RegraUsuario[] {
  if (ehSuperAdmin(usuario)) return ["ADMIN", "ADMIN_PAINEL", "LIDER", "MUSICOS"];
  if (ehAdminDePainel(usuario)) return ["LIDER", "MUSICOS"];
  return [];
}
