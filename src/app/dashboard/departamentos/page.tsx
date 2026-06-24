import Link from "next/link";
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
  listarDepartamentos,
  removerDepartamento,
  slugJaExiste,
} from "@/core/db/queries";

const CAMINHO_DEPARTAMENTOS = "/dashboard/departamentos";
const PREFIXO_REGEX = /^[A-Z]+$/;

function gerarSlugUnico(nome: string): string {
  const base = gerarSlug(nome) || "departamento";
  if (!slugJaExiste(base)) return base;

  let contador = 2;
  while (slugJaExiste(`${base}-${contador}`)) {
    contador += 1;
  }
  return `${base}-${contador}`;
}

export default async function DepartamentosIndexPage() {
  const usuarioAtual = await getUsuarioAtual();
  const ehAdmin = usuarioAtual?.regra === "ADMIN";
  const departamentos = listarDepartamentos();

  async function handleCriarDepartamento(valores: NovoDepartamentoInput) {
    "use server";
    if (!PREFIXO_REGEX.test(valores.codigoPrefixo)) {
      throw new Error("O prefixo deve conter apenas letras (ex: SA, AD, JD, RS).");
    }
    if (codigoPrefixoJaExiste(valores.codigoPrefixo)) {
      throw new Error("Já existe um departamento com esse prefixo.");
    }
    const slug = gerarSlugUnico(valores.nome);
    criarDepartamento({ nome: valores.nome, slug, codigoPrefixo: valores.codigoPrefixo });
    revalidatePath(CAMINHO_DEPARTAMENTOS);
  }

  async function handleAtualizarDepartamento(id: string, valores: DepartamentoEditavel) {
    "use server";
    if (!PREFIXO_REGEX.test(valores.codigoPrefixo)) {
      throw new Error("O prefixo deve conter apenas letras (ex: SA, AD, JD, RS).");
    }
    if (codigoPrefixoJaExiste(valores.codigoPrefixo, id)) {
      throw new Error("Já existe outro departamento com esse prefixo.");
    }
    atualizarDepartamento(id, valores);
    revalidatePath(CAMINHO_DEPARTAMENTOS);
  }

  async function handleRemoverDepartamento(id: string) {
    "use server";
    removerDepartamento(id);
    revalidatePath(CAMINHO_DEPARTAMENTOS);
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Departamentos</h1>
        <p className="text-sm text-muted-foreground">
          Escolha um departamento para abrir sua planilha de louvores.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departamentos.map((departamento) => (
          <Link
            key={departamento.id}
            href={`/dashboard/departamentos/${departamento.slug}`}
            className="flex flex-col gap-3 rounded-lg border p-5 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center justify-between">
              <Music2 className="h-5 w-5 text-muted-foreground" />
              <Badge variant="secondary" className="font-mono">
                {departamento.codigo_prefixo}
              </Badge>
            </div>
            <span className="font-medium">{departamento.nome}</span>
          </Link>
        ))}

        {departamentos.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum departamento cadastrado ainda.
          </p>
        )}
      </div>

      {ehAdmin && (
        <div className="flex flex-col gap-3">
          <header>
            <h2 className="text-lg font-semibold tracking-tight">Gerenciar departamentos</h2>
            <p className="text-sm text-muted-foreground">
              Crie, renomeie ou remova departamentos. O prefixo define o código sequencial das
              músicas (ex: SA → SA1, SA2...). Remover um departamento apaga também sua planilha
              de louvores.
            </p>
          </header>
          <DepartamentosManager
            data={departamentos}
            onCriarDepartamento={handleCriarDepartamento}
            onAtualizarDepartamento={handleAtualizarDepartamento}
            onRemoverDepartamento={handleRemoverDepartamento}
          />
        </div>
      )}
    </div>
  );
}
