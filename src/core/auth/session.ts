import { SignJWT, jwtVerify } from "jose";

import type { RegraUsuario } from "@/types/database.types";

export const NOME_COOKIE_SESSAO = "painel_session";
const DURACAO_SESSAO_SEGUNDOS = 60 * 60 * 24 * 7; // 7 dias

export interface PayloadSessao {
  id: string;
  regra: RegraUsuario;
}

function obterSegredo(): Uint8Array {
  const segredo = process.env.SESSION_SECRET;
  if (!segredo) {
    throw new Error(
      "SESSION_SECRET não configurado. Defina uma string aleatória longa em .env.local."
    );
  }
  return new TextEncoder().encode(segredo);
}

/** Assina um token de sessão (JWT) contendo o id e a regra do usuário. */
export async function criarTokenSessao(payload: PayloadSessao): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_SESSAO_SEGUNDOS}s`)
    .sign(obterSegredo());
}

/** Verifica e decodifica um token de sessão. Retorna `null` se inválido/expirado. */
export async function verificarTokenSessao(token: string): Promise<PayloadSessao | null> {
  try {
    const { payload } = await jwtVerify(token, obterSegredo());
    if (typeof payload.id !== "string" || typeof payload.regra !== "string") {
      return null;
    }
    return { id: payload.id, regra: payload.regra as RegraUsuario };
  } catch {
    return null;
  }
}

export const DURACAO_COOKIE_SESSAO_SEGUNDOS = DURACAO_SESSAO_SEGUNDOS;
