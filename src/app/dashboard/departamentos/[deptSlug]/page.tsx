import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { LouvoresTable } from "@/components/LouvoresTable";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import { gerarProximoCodigo } from "@/core/utils/code-generator";
import {
  atualizarLouvor,
  criarLouvor,
  definirOrdemExecucao,
  getDepartamentoPorSlug,
  listarCodigosPorDepartamento,
  listarLouvoresPorDepartamento,
  listarOrdemPorDepartamento,
  removerLouvor,
} from "@/core/db/queries";
import type { LouvorEditavel, NovoLouvorInput } from "@/types/database.types";

interface DepartamentoPageProps {
  params: Promise<{ deptSlug: string }>;
}

export default async function DepartamentoPage({ params }: DepartamentoPageProps) {
  const { deptSlug } = await params;
  const departamento = getDepartamentoPorSlug(deptSlug);

  if (!departamento) {
    notFound();
  }

  const departamentoId = departamento.id;
  const codigoPrefixoDepartamento = departamento.codigo_prefixo;
  const louvores = listarLouvoresPorDepartamento(departamentoId);
  const caminhoAtual = `/dashboard/departamentos/${deptSlug}`;

  const usuarioAtual = await getUsuarioAtual();
  const podeEditar = usuarioAtual?.regra === "ADMIN" || usuarioAtual?.regra === "LIDER";

  async function handleAtualizarLinha(id: string, valores: Partial<LouvorEditavel>) {
    "use server";
    atualizarLouvor(id, valores);
    revalidatePath(caminhoAtual);
  }

  async function handleAdicionarLinha(valores: NovoLouvorInput) {
    "use server";
    const codigosExistentes = listarCodigosPorDepartamento(valores.departamento_id);
    const proximoCodigo = gerarProximoCodigo(codigoPrefixoDepartamento, codigosExistentes);
    criarLouvor(valores, proximoCodigo);
    revalidatePath(caminhoAtual);
  }

  async function handleRemoverLinha(id: string) {
    "use server";
    removerLouvor(id);
    revalidatePath(caminhoAtual);
  }

  async function handleReordenarLinha(id: string, direcao: "up" | "down") {
    "use server";
    const linhas = listarOrdemPorDepartamento(departamentoId);
    const indiceAtual = linhas.findIndex((linha) => linha.id === id);
    if (indiceAtual === -1) return;

    const indiceVizinho = direcao === "up" ? indiceAtual - 1 : indiceAtual + 1;
    if (indiceVizinho < 0 || indiceVizinho >= linhas.length) return;

    const atual = linhas[indiceAtual];
    const vizinho = linhas[indiceVizinho];
    definirOrdemExecucao(atual.id, vizinho.ordem_execucao);
    definirOrdemExecucao(vizinho.id, atual.ordem_execucao);
    revalidatePath(caminhoAtual);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{departamento.nome}</h1>
        <p className="text-sm text-muted-foreground">
          Planilha de louvores — código {departamento.codigo_prefixo}1, {departamento.codigo_prefixo}2...
        </p>
      </header>

      <LouvoresTable
        data={louvores}
        departamentoId={departamentoId}
        codigoPrefixo={codigoPrefixoDepartamento}
        editavel={podeEditar}
        onAtualizarLinha={handleAtualizarLinha}
        onAdicionarLinha={handleAdicionarLinha}
        onRemoverLinha={handleRemoverLinha}
        onReordenarLinha={handleReordenarLinha}
      />
    </div>
  );
}
