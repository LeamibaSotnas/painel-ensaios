"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verificarSenha } from "@/core/auth/password";
import { DURACAO_COOKIE_SESSAO_SEGUNDOS, NOME_COOKIE_SESSAO, criarTokenSessao } from "@/core/auth/session";
import { getUsuarioPorEmail } from "@/core/db/queries";

const MENSAGEM_ERRO_PADRAO = "E-mail ou senha inválidos.";

export async function entrar(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    redirect(`/?erro=${encodeURIComponent(MENSAGEM_ERRO_PADRAO)}`);
  }

  const usuario = await getUsuarioPorEmail(email);
  if (!usuario) {
    redirect(`/?erro=${encodeURIComponent(MENSAGEM_ERRO_PADRAO)}`);
  }

  const senhaValida = await verificarSenha(senha, usuario.senha_hash);
  if (!senhaValida) {
    redirect(`/?erro=${encodeURIComponent(MENSAGEM_ERRO_PADRAO)}`);
  }

  // Se SESSION_SECRET estiver ausente nas vars de ambiente do Vercel,
  // criarTokenSessao lança — redireciona para login com mensagem em vez de crashar.
  const token = await criarTokenSessao({
    id: usuario.id,
    regra: usuario.regra,
    departamentoId: usuario.departamento_id,
  }).catch(() =>
    redirect(
      `/?erro=${encodeURIComponent("Erro de configuração do servidor. Adicione SESSION_SECRET nas variáveis de ambiente do Vercel.")}`
    )
  );
  const cookieStore = await cookies();
  cookieStore.set(NOME_COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_COOKIE_SESSAO_SEGUNDOS,
  });

  redirect("/dashboard");
}

export async function sair() {
  const cookieStore = await cookies();
  cookieStore.delete(NOME_COOKIE_SESSAO);
  redirect("/");
}
