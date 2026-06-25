import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { NOME_COOKIE_SESSAO, verificarTokenSessao } from "@/core/auth/session";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(NOME_COOKIE_SESSAO)?.value;
  const sessao = token ? await verificarTokenSessao(token) : null;

  const { pathname } = request.nextUrl;
  const isRotaDashboard = pathname.startsWith("/dashboard");
  const isRotaLogin = pathname === "/";

  if (!sessao && isRotaDashboard) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (sessao && isRotaLogin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Camada extra de proteção: só Super Admin e Administrador de Painel podem
  // acessar a gestão de usuários. O escopo por departamento (Admin de Painel
  // só vê o próprio time) é aplicado dentro da página, que tem acesso ao banco.
  const isRotaUsuarios = pathname.startsWith("/dashboard/usuarios");
  if (isRotaUsuarios && sessao && sessao.regra !== "ADMIN" && sessao.regra !== "ADMIN_PAINEL") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
