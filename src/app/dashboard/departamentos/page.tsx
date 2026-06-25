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
import { podeGerenciarDepartamentos } from "@/core/auth/permissoes";
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
  // Apenas o Super Administrador gerencia (cria/edita/exclui) departamentos —
  // Administrador de Painel, Líder e Membro só visualizam o próprio departamento.
  const podeGerenciar = podeGerenciarDepartamentos(usuarioAtual);

  if (!podeGerenciar && usuarioAtual?.departamento_id) {
    const meuDepartamento = await getDepartamentoPorId(usuarioAtual.departamento_id);
    if (meuDepartamento) {
      redirect(`/dashboard/departamentos/${meuDepartamento.slug}`);
    }
  }

  const departamentos = await listarDepartamentos();

  // Nota: as actions abaixo retornam `{ erro }` em vez de lançar exceção —
  // erros lançados (throw) dentro de Server Actions chegam mascarados ao
  // cliente em produção ("An error occurred in the Server Components
  // render..."), escondendo a mensagem real.
  async function handleCriarDepartamento(
    valores: NovoDepartamentoInput
  ): Promise<{ erro?: string }> {
    "use server";
    const prefixo = valores.codigoPrefixo.trim().toUpperCase();
    if (!PREFIXO_REGEX.test(prefixo)) {
      return { erro: "O prefixo deve conter apenas letras (ex.: SA, AD, JD)." };
    }
    if (await codigoPrefixoJaExiste(prefixo)) {
      return { erro: "Esse prefixo já está em uso por outro departamento." };
    }
    try {
      const slug = await gerarSlugUnico(valores.nome);
      await criarDepartamento({ nome: valores.nome, slug, codigoPrefixo: prefixo });
    } catch (erro) {
      return { erro: erro instanceof Error ? erro.message : "Falha ao criar no banco de dados." };
    }
    revalidatePath(CAMINHO_DEPARTAMENTOS);
    return {};
  }

  async function handleAtualizarDepartamento(
    id: string,
    valores: DepartamentoEditavel
  ): Promise<{ erro?: string }> {
    "use server";
    const prefixo = valores.codigoPrefixo.trim().toUpperCase();
    if (!PREFIXO_REGEX.test(prefixo)) {
      return { erro: "O prefixo deve conter apenas letras (ex.: SA, AD, JD)." };
    }
    if (await codigoPrefixoJaExiste(prefixo, id)) {
      return { erro: "Esse prefixo já está em uso por outro departamento." };
    }
    try {
      await atualizarDepartamento(id, { nome: valores.nome, codigoPrefixo: prefixo });
    } catch (erro) {
      return { erro: erro instanceof Error ? erro.message : "Falha ao salvar no banco de dados." };
    }
    revalidatePath(CAMINHO_DEPARTAMENTOS);
    return {};
  }

  async function handleRemoverDepartamento(id: string): Promise<{ erro?: string }> {
    "use server";
    try {
      await removerDepartamento(id);
    } catch (erro) {
      return { erro: erro instanceof Error ? erro.message : "Falha ao remover no banco de dados." };
    }
    revalidatePath(CAMINHO_DEPARTAMENTOS);
    return {};
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-amber-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          Departamentos
        </h1>
        <p className="text-sm text-muted-foreground">
          Veja a planilha de repertório de cada departamento.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {departamentos.map((departamento) => (
          <Link
            key={departamento.id}
            href={`/dashboard/departamentos/${departamento.slug}`}
            className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-white/70 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600">
              <Music2 className="h-4 w-4" />
            </span>
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

      {podeGerenciar && (
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
