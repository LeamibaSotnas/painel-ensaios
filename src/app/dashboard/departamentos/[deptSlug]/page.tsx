import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { LouvoresTable } from "@/components/LouvoresTable";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import { podeEditarDepartamento, podeVerDepartamento } from "@/core/auth/permissoes";
import { gerarProximoCodigo } from "@/core/utils/code-generator";
import { imagemDoDepartamento } from "@/core/utils/dept-imagem";
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

  return (
    <div className="flex flex-col gap-6">
      {/* Banner com imagem específica do departamento + nome elegante sobreposto */}
      <div className="relative -mx-4 -mt-4 mb-2 h-44 overflow-hidden rounded-t-2xl md:-mx-6 md:-mt-6 md:h-56">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagemDoDepartamento(departamento.nome)}
          alt=""
          className="h-full w-full object-cover object-center"
          loading="eager"
        />
        {/* gradiente duplo: escurece base para legibilidade + toque sutil no topo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
        {/* Nome elegante sobre a imagem */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 md:px-7 md:pb-6">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">
            Planilha de louvores · {departamento.codigo_prefixo}
          </p>
          <h1
            className="text-3xl font-black uppercase tracking-[0.12em] text-white md:text-4xl"
            style={{ textShadow: "0 0 40px rgba(168,85,247,0.6), 0 2px 8px rgba(0,0,0,0.9)" }}
          >
            {departamento.nome}
          </h1>
        </div>
      </div>

      <LouvoresTable
        data={louvores}
        departamentoId={departamentoId}
        codigoPrefixo={codigoPrefixoDepartamento}
        nomeDepartamento={departamento.nome}
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
