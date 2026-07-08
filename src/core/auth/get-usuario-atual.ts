import { cookies } from "next/headers";

import { getUsuarioPorId } from "@/core/db/queries";
import { NOME_COOKIE_SESSAO, verificarTokenSessao } from "@/core/auth/session";
import type { Usuario } from "@/types/database.types";

/**
 * Lê o cookie de sessão atual e retorna o usuário correspondente (ou `null`).
 *
 * Nunca lança exceção: se o banco estiver indisponível ou o token inválido,
 * retorna `null` — o layout do dashboard redireciona para login automaticamente.
 */
export async function getUsuarioAtual(): Promise<Usuario | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(NOME_COOKIE_SESSAO)?.value;
    if (!token) return null;

    const payload = await verificarTokenSessao(token);
    if (!payload) return null;

    const usuario = await getUsuarioPorId(payload.id);
    return usuario ?? null;
  } catch {
    // Banco indisponível, SESSION_SECRET ausente, token corrompido, etc.
    // Retorna null para que o layout redirecione ao login em vez de crashar.
    return null;
  }
}
