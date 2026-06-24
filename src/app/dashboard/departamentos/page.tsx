import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Music2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DepartamentosManager,
  type DepartamentoEditavel,
  type NovoDepartamentoInput,
} from "@/components/DepartamentosManager";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import { gerarSlug } from "@/core/utils/slug";
import {
  atualizarDepartamento,
  codigoPrefixoJaExiste,
  criarDepartamento,
  getDepartamentoPorId,
  listarDepartamentos,
  removerDepartamento,
  slugJaExiste,
} from "@/core/db/queries";

const CAMINHO_DEPARTAMENTOS = "/dashboard/departamentos";
const PREFIXO_REGEX = /^[A-Z]+$/;

async function gerarSlugUnico(nome: string): Promise<string> {
  const base = gerarSlug(nome) || "departamento";
  if (!(await slugJaExiste(base))) return base;

  let contador = 2;
  while (await slugJaExiste(`${base}-${contador}`)) {
    contador += 1;
  }
  return `${base}-${contador}`;
}

export default async function DepartamentosIndexPage() {
  const usuarioAtual = await getUsuarioAtual();
  const ehAdmin = usuarioAtual?.regra === "ADMIN";

  if (!ehAdmin && usuarioAtual?.departamento_id) {
    const meuDepartamento = await getDepartamentoPorId(usuarioAtual.departamento_id);
    if (meuDep