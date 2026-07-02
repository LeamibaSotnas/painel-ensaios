import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { LouvoresTable } from "@/components/LouvoresTable";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import { podeEditarDepartamento, podeVerDepartamento } from "@/core/auth/permissoes";
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

  // Super Admin vê todos os departamentos; demais (Admin de Painel, Líder,
  // Membro) só acessam o próprio — bloqueia visualização cruzada entre departamentos.
  if (!podeVerDepartamento(usuarioAtual, departamentoId)) {
    redirect("/dashboard/departamentos");
  }

  const louvores = await listarLouvoresPorDepartamento(departamentoId);
  // Super Admin, Admin de Painel e Líder podem editar o repertório do próprio
  // departamento; Admin de Painel/Líder nunca editam o de outro departamento
  // (já garantido pelo redirect acima).
  const podeEditar = podeEditarDepartamento(usuarioAtual, departamentoId);

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

  function imagemDoDepartamento(nome: string): string {
    const n = nome.toLowerCase();
    if (/adolescen|jovem|jovens|youth|teen/.test(n))
      return "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80";
    if (/crian|kids|infantil|infanto/.test(n))
      return "https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=1200&q=80";
    if (/adulto|adult|melhor idade|s[eê]nior/.test(n))
      return "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200&q=80";
    if (/loa|aban|worship|louvor/.test(n))
      return "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80";
    return "https://images.unsplash.com/photo-1501386761578-eaa54b915e8a?w=1200&q=80";
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Banner de imagem realista, específico por departamento */}
      <div className="relative -mx-4 -mt-4 mb-2 h-40 overflow-hidden rounded-t-2xl md:-mx-6 md:-mt-6 md:h-52">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagemDoDepartamento(departamento.nome)}
          alt=""
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 md:p-6">
          <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-lg">
            {departamento.nome}
          </h1>
          <p className="text-sm text-white/70">
            Planilha de louvores · {departamento.codigo_prefixo}1, {departamento.codigo_prefixo}2…
          </p>
        </div>
      </div>

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
