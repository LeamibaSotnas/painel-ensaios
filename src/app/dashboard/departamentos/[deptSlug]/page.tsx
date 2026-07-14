import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { BannerAvisosDepartamento } from "@/components/BannerAvisosDepartamento";
import { LouvoresTable } from "@/components/LouvoresTable";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import { podeEditarDepartamento, podeVerDepartamento } from "@/core/auth/permissoes";
import { gerarProximoCodigo } from "@/core/utils/code-generator";
import { imagemDoDepartamento } from "@/core/utils/dept-imagem";
import { gradienteDoDepartamento, luzDoBanner } from "@/core/utils/dept-tema";
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
  listarObservacoes,
  listarOrdemPorDepartamento,
  listarTodosEnsaios,
  marcarExecutado,
  removerLouvor,
} from "@/core/db/queries";
import type {
  EnsaioGradeComDepartamento,
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

  if (!podeVerDepartamento(usuarioAtual, departamentoId)) {
    redirect("/dashboard/departamentos");
  }

  const hoje = new Date().toISOString().split("T")[0];
  const [louvores, observacoesDept, ensaiosDept] = await Promise.all([
    listarLouvoresPorDepartamento(departamentoId),
    listarObservacoes(departamentoId).catch(() => []),
    listarTodosEnsaios(departamentoId).catch(() => []),
  ]);
  // Apenas ensaios de hoje em diante, ordenados por data (query ja retorna ordenado)
  const proximosEnsaios: EnsaioGradeComDepartamento[] = ensaiosDept
    .filter((e) => e.data >= hoje)
    .slice(0, 3);

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
    <div className="flex flex-col">
      {/* Banner com foto + luzes de palco por departamento */}
      <div className="relative -mx-4 -mt-4 h-44 overflow-hidden md:-mx-6 md:-mt-6 md:h-56">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagemDoDepartamento(departamento.nome)}
          alt=""
          className="h-full w-full object-cover object-center"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
        <div
          className="absolute inset-0"
          style={{ background: luzDoBanner(departamento.nome) }}
        />
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 md:px-7 md:pb-6">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">
            Planilha de louvores &middot; {departamento.codigo_prefixo}
          </p>
          <h1
            className="text-3xl font-black uppercase tracking-[0.12em] text-white md:text-4xl"
            style={{ textShadow: "0 0 40px rgba(168,85,247,0.6), 0 2px 8px rgba(0,0,0,0.9)" }}
          >
            {departamento.nome}
          </h1>
        </div>
      </div>

      {/* Area de conteudo com gradiente exclusivo por departamento */}
      <div
        className="-mx-4 -mb-4 px-4 py-6 md:-mx-6 md:-mb-6 md:px-6"
        style={{ background: gradienteDoDepartamento(departamento.nome) }}
      >
        {/* Banner de proximos ensaios — visivel para todos os membros */}
        {proximosEnsaios.length > 0 && (
          <div className="mb-4 overflow-hidden rounded-2xl border border-violet-200/80 bg-white/90 shadow-sm">
            <div className="flex items-center gap-2 border-b border-violet-100 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5">
              <span className="text-base">🎵</span>
              <p className="text-sm font-bold text-white">
                {proximosEnsaios.length === 1 ? "Próximo ensaio" : `Próximos ${proximosEnsaios.length} ensaios`}
              </p>
            </div>
            <div className="divide-y divide-violet-50">
              {proximosEnsaios.map((ensaio) => {
                const dataObj = new Date(ensaio.data + "T12:00:00");
                const dataFormatada = dataObj.toLocaleDateString("pt-BR", {
                  weekday: "short", day: "2-digit", month: "short",
                });
                return (
                  <div key={ensaio.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span className="text-sm font-bold capitalize text-violet-700">
                        {dataFormatada}
                      </span>
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-600">
                        {ensaio.hora_inicio} &ndash; {ensaio.hora_fim}
                      </span>
                      {ensaio.local && (
                        <span className="text-[11px] text-muted-foreground">
                          📍 {ensaio.local}
                        </span>
                      )}
                      {ensaio.responsavel && (
                        <span className="text-[11px] text-muted-foreground">
                          👤 {ensaio.responsavel}
                        </span>
                      )}
                    </div>
                    {ensaio.observacoes && (
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                        {ensaio.observacoes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Banner de avisos para ADMIN_PAINEL e MUSICOS */}
        {observacoesDept.length > 0 && (
          <div className="mb-6">
            <BannerAvisosDepartamento
              observacoes={observacoesDept}
              nomeDepartamento={departamento.nome}
              ehEditor={podeEditar}
            />
          </div>
        )}

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
    </div>
  );
}
