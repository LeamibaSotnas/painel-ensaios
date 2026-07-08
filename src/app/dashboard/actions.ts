"use server";

/**
 * Server Actions do Mural de Observações.
 *
 * Mantidas em arquivo separado (com "use server" no topo do módulo) para
 * evitar problemas de serialização de closure em Next.js 15, onde server
 * actions definidas inline em Server Components precisam criptografar todos
 * os valores capturados pelo closure — o que pode falhar quando o objeto
 * capturado contém campos não-serializáveis ou quando `usuarioAtual`
 * é `undefined` (sessão expirada).
 *
 * O padrão correto é passar os dados do usuário como parâmetros explícitos
 * e usar `.bind()` no Server Component para pré-vinculá-los.
 */

import { revalidatePath } from "next/cache";

import {
  atualizarStatusObservacao,
  criarObservacao,
  removerObservacao,
} from "@/core/db/queries";
import type { CategoriaObservacao, PrioridadeObservacao } from "@/types/database.types";

/** Cria uma nova observação no mural. */
export async function criarObservacaoAction(
  autorNome: string,
  autorId: string,
  dados: {
    titulo: string;
    descricao: string;
    prioridade: PrioridadeObservacao;
    categoria: CategoriaObservacao;
    departamentoId: string | null;
  }
): Promise<void> {
  if (!autorId) return; // segurança extra: nunca persiste sem usuário
  await criarObservacao({
    titulo: dados.titulo,
    descricao: dados.descricao,
    autorNome,
    autorId,
    departamentoId: dados.departamentoId,
    prioridade: dados.prioridade,
    categoria: dados.categoria,
  });
  revalidatePath("/dashboard");
}

/** Arquiva (soft-delete) uma observação existente. */
export async function arquivarObservacaoAction(id: string): Promise<void> {
  await atualizarStatusObservacao(id, "ARQUIVADA");
  revalidatePath("/dashboard");
}

/** Remove permanentemente uma observação. */
export async function removerObservacaoAction(id: string): Promise<void> {
  await removerObservacao(id);
  revalidatePath("/dashboard");
}
