import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { LouvoresTable } from "@/components/LouvoresTable";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import { gerarProximoCodigo } from "@/core/utils/code-generator";
import { buscarMetadadosYoutube, buscarVideosYoutube } from "@/core/utils/youtube";
import {
  alternarFavorito,
  atualizarDetalhesLouvor,
  atualizarLouvor,
  criarLouvor,
  definirOrdemExecucao,
  getDepartamentoPorSlug,
  listarCodigosPorDepartamento,
  listarLouvoresPorDepartamento,
  listarOrdemPorDepartamento,
  marcarExecutado,
  removerLouvor,
} from "@/core/db/queries";
import type {
  LouvorDetalhesEditavel,
  LouvorEditavel,
  NovoLouvorInput,
} from "@/types/database.types";

interface DepartamentoPageProps {
  params: Promise<{ deptSlug: string }>;
}

export default async function DepartamentoPage({ params }: DepartamentoPageProps) {
  const { deptSlug } = await params;
  const departamento = await getDepartamentoPorSlug(deptSlug);

  if (!departamento) {
    notFound();
  }

  const departamentoId = departamento.id;
  const codigoPrefixoDepartamento = departamento.codigo_prefixo;
  const caminhoAtual = `/dashboard/departamentos/${deptSlug}`;

  const usuarioAtual = await getUsuarioAtual();
  const ehAdmin = usuarioAtual?.regra === "ADMIN";

  if (!ehAdmin && usuarioAtual?.departamento_id !== departamentoId) {
    redirect("/dashboard/departamentos");
  }

  const louvores = await listarLouvoresPorDepartamento(departamentoId);
  const podeEditar = ehAdmin || usuarioAtual?.regra === "LIDER";

  async function handleAtualizarLinha(id: string, valores: LouvorEditavel) {
    "use server";
    await atualizarLouvor(id, valores);
    revalidatePath(caminhoAtual);
  }

  async function handleAdicionarLinha(valores: NovoLouvorInput) {
    "use server";
    const codigosExistentes = await listarCodigosPorDepartamento(valores.departamento_id);
    const proximoCodigo = gerarProximoCodigo(codigoPrefixoDepartamento, codigosExistentes);
    await criarLouvor(valores, proximoCodigo);
    revalidatePath(caminhoAtual);
  }

  async function handleRemoverLinha(id: string) {
    "use server";
    await removerLouvor(id);
    revalidatePath(caminhoAtual);
  }

  async function handleReordenarLinha(id: string, direcao: "up" | "down") {
    "use server";
    const linhas = await listarOrdemPorDepartamento(departamentoId);
    const indiceAtual = linhas.findIndex((linha) => linha.id === id);
    if (indiceAtual === -1) return;

    const indiceVizinho = direcao === "up" ? indiceAtual - 1 : indiceAtual + 1;
    if (indiceVizinho < 0 || indiceVizinho >= linhas.length) return;

    const atual = linhas[indiceAtual];
    const vizinho = linhas[indiceVizinho];
    await definirOrdemExecucao(atual.id, vizinho.ordem_execucao);
    await definirOrdemExecucao(vizinho.id, atual.ordem_execucao);
    revalidatePath(caminhoAtual);
  }

  async function handleAlternarFavorito(id: string, favorito: boolean) {
    "use server";
    await alternarFavorito(id, favorito);
    revalidatePath(caminhoAtual);
  }

  async function handleMarcarExecutado(id: string) {
    "use server";
    await marcarExecutado(id);
    revalidatePath(caminhoAtual);
  }

  async function handleAtualizarDetalhes(id: string, valores: LouvorDetalhesEditavel) {
    "use server";
    await atualizarDetalhesLouvor(id, valores);
    revalidatePath(caminhoAtual);
  }

  async function handleBuscarMetadadosYoutube(url: string) {
    "use server";
    return buscarMetadadosYoutube(url);
  }

  async function handleBuscarVideosYoutube(query: string) {
    "use server";
    return buscarVideosYoutube(query);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-amber-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          {departamento.nome}
        </h1>
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
        onAlternarFavorito={handleAlternarFavorito}
        onMarcarExecutado={handleMarcarExecutado}
        onAtualizarDetalhes={handleAtualizarDetalhes}
        onBuscarMetadadosYoutube={handleBuscarMetadadosYoutube}
        onBuscarVideosYoutube={handleBuscarVideosYoutube}
      />
    </div>
  );
}
