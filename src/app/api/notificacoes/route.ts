import { NextRequest, NextResponse } from "next/server";

import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import { contarObservacoesNovas } from "@/core/db/queries";

export async function GET(req: NextRequest) {
  try {
    const usuario = await getUsuarioAtual();
    if (!usuario) return NextResponse.json({ total: 0 });

    const desde = req.nextUrl.searchParams.get("desde") ?? undefined;
    const deptId = usuario.departamento_id ?? undefined;

    const total = await contarObservacoesNovas(deptId, desde);
    return NextResponse.json({ total });
  } catch {
    return NextResponse.json({ total: 0 });
  }
}
