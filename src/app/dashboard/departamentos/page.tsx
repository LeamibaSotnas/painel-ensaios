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
    if (meuDepartamento) {
      redirect(`/dashboard/departamentos/${meuDepartamento.slug}`);
    }
  }

  const departamentos = await listarDepartamentos();

  async function handleCriarDepartamento(valores: NovoDepartamentoInput) {
    "use server";
    const prefixo = valores.codigoPrefixo.trim().toUpperCase();
    if (!PREFIXO_REGEX.test(prefixo)) {
      throw new Error("O prefixo deve conter apenas letras (ex.: SA, AD, JD).");
    }
    if (await codigoPrefixoJaExiste(prefixo)) {
      throw new Error("Esse prefixo já está em uso por outro departamento.");
    }
    const slug = await gerarSlugUnico(valores.nome);
    await criarDepartamento({ nome: valores.nome, slug, codigoPrefixo: prefixo });
    revalidatePath(CAMINHO_DEPARTAMENTOS);
  }

  async function handleAtualizarDepartamento(id: string, valores: DepartamentoEditavel) {
    "use server";
    const prefixo = valores.codigoPrefixo.trim().toUpperCase();
    if (!PREFIXO_REGEX.test(prefixo)) {
      throw new Error("O prefixo deve conter apenas letras (ex.: SA, AD, JD).");
    }
    if (await codigoPrefixoJaExiste(prefixo, id)) {
      throw new Error("Esse prefixo já está em uso por outro departamento.");
    }
    await atualizarDepartamento(id, { nome: valores.nome, codigoPrefixo: prefixo });
    revalidatePath(CAMINHO_DEPARTAMENTOS);
  }

  async function handleRemoverDepartamento(id: string) {
    "use server";
    await removerDepartamento(id);
    revalidatePath(CAMINHO_DEPARTAMENTOS);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Departamentos</h1>
        <p className="text-sm text-muted-foreground">
          Veja a planilha de repertório de cada departamento.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {departamentos.map((departamento) => (
          <Link
            key={departamento.id}
            href={`/dashboard/departamentos/${departamento.slug}`}
            className="flex items-center gap-3 rounded-lg border bg-white/70 p-4 shadow-sm transition-colors hover:bg-white"
          >
            <Music2 className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-1 flex-col">
              <span className="font-medium">{departamento.nome}</span>
              <span className="text-xs text-muted-foreground">
                Código {departamento.codigo_prefixo}
              </span>
            </div>
            <Badge variant="outline">{departamento.codigo_prefixo}</Badge>
          </Link>
        ))}
      </div>

      {ehAdmin && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Gerenciar departamentos
          </h2>
          <DepartamentosManager
            data={departamentos}
            onCriarDepartamento={handleCriarDepartamento}
            onAtualizarDepartamento={handleAtualizarDepartamento}
            onRemoverDepartamento={handleRemoverDepartamento}
          />
        </section>
      )}
    </div>
  );
}
