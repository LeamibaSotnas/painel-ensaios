/**
 * Tipos do banco de dados (Postgres na nuvem, via @vercel/postgres).
 *
 * O banco fica hospedado na nuvem (Vercel Postgres / Neon), compartilhado
 * por todos os usuários do app — schema, migrações de coluna e seed inicial
 * são criados e aplicados automaticamente em `src/core/db/client.ts`.
 */

/**
 * ADMIN — Super Administrador: controle total do sistema, todos os departamentos.
 * ADMIN_PAINEL — Administrador de Painel: controla apenas o próprio departamento
 * (gerencia usuários e repertório locais, mas não vê nem afeta outros departamentos).
 * LIDER — gerencia repertório/ensaios do próprio departamento.
 * MUSICOS — apenas visualiza/atualiza informações autorizadas (Membro).
 */
export type RegraUsuario = "ADMIN" | "ADMIN_PAINEL" | "LIDER" | "MUSICOS";

/** Linha completa de `usuarios`, incluindo o hash da senha. Uso interno. */
export interface UsuarioRegistro {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  regra: RegraUsuario;
  /** Departamento ao qual o usuário pertence. `null` para ADMIN (acesso a todos). */
  departamento_id: string | null;
  criado_em: string;
}

/** Versão segura de `Usuario`, sem o hash da senha — a única que circula pela UI. */
export type Usuario = Omit<UsuarioRegistro, "senha_hash">;

/** `Usuario` com o nome/slug do departamento já resolvidos, para exibição em listas. */
export interface UsuarioComDepartamento extends Usuario {
  departamento_nome: string | null;
}

export interface Departamento {
  id: string;
  nome: string;
  slug: string;
  codigo_prefixo: string;
}

export interface EnsaioGrade {
  id: string;
  data: string; // ISO date (YYYY-MM-DD)
  hora_inicio: string; // HH:mm
  hora_fim: string; // HH:mm
  departamento_id: string;
  local: string;
  responsavel: string;
  observacoes: string;
}

export type EnsaioEditavel = Pick<
  EnsaioGrade,
  "data" | "hora_inicio" | "hora_fim" | "departamento_id" | "local" | "responsavel" | "observacoes"
>;

/** `EnsaioGrade` com o nome/slug do departamento já resolvidos, para exibição em listas. */
export interface EnsaioGradeComDepartamento extends EnsaioGrade {
  departamento_nome: string;
  departamento_slug: string;
}

/**
 * Classificação visual de uma música no repertório.
 * Permite identificar rapidamente o contexto/finalidade de cada louvor.
 */
export type TipoLouvor =
  | "ATUAL"         // 🟢 Música do repertório corrente
  | "NOVA"          // 🟡 Música nova sendo ensaiada
  | "ESPECIAL"      // 🔵 Música especial
  | "CONGRESSO"     // 🟣 Preparada para congresso
  | "CONFRATERNIZACAO" // 🟠 Confraternização
  | "EVENTO";       // 🔴 Evento especial

/**
 * Linha da planilha de louvores. Representa exatamente uma linha
 * editável na tabela `louvores_planilha`.
 */
export interface LouvorPlanilha {
  id: string;
  codigo_sequencial: string; // Ex: SA1, AD2
  departamento_id: string;
  nome_louvor: string;
  cantor_banda: string;
  tonalidade: string; // Ex: G, Am, C#m
  link_youtube: string | null;
  /** Título capturado automaticamente via oEmbed do YouTube. */
  youtube_titulo: string | null;
  /** URL da miniatura capturada automaticamente via oEmbed do YouTube. */
  youtube_thumbnail: string | null;
  /** Nome do canal, capturado automaticamente via oEmbed do YouTube. */
  youtube_canal: string | null;
  /** Cifra (texto livre ou link para a cifra). */
  cifra: string;
  /** Observações livres sobre o louvor. */
  observacoes: string;
  /** Marcado como favorito pelo departamento. */
  favorito: boolean;
  /** Data (ISO) da última vez que o louvor foi executado/ensaiado. */
  ultima_execucao: string | null;
  /** Quantas vezes esse louvor já foi marcado como executado. */
  vezes_executado: number;
  ordem_execucao: number;
  /** Timestamp (ISO) da última alteração de cadastro/edição dessa linha. */
  atualizado_em: string;
  /** Classificação visual do louvor (opcional). */
  tipo_louvor: TipoLouvor | null;
  /** Nome do evento ao qual este louvor está vinculado (opcional). */
  evento_nome: string | null;
}

// ---------------------------------------------------------------------------
// Observações / Mural
// ---------------------------------------------------------------------------

export type PrioridadeObservacao = "NORMAL" | "ALTA" | "URGENTE";

export type CategoriaObservacao =
  | "AVISO"
  | "COMUNICADO"
  | "ENSAIO"
  | "MUDANCA"
  | "ESCALA"
  | "URGENTE";

export type StatusObservacao = "ATIVA" | "RESOLVIDA" | "ARQUIVADA";

export interface ObservacaoMural {
  id: string;
  titulo: string;
  descricao: string;
  autor_nome: string;
  autor_id: string;
  /** ID do departamento alvo; null = visível para todos. */
  departamento_id: string | null;
  prioridade: PrioridadeObservacao;
  categoria: CategoriaObservacao;
  status: StatusObservacao;
  criado_em: string;
  atualizado_em: string;
}

/**
 * Payload aceito ao criar uma nova linha. O código sequencial e o id
 * são derivados/gerados no servidor (ou via code-generator.ts),
 * por isso não fazem parte do input do usuário.
 */
export type NovoLouvorInput = Pick<
  LouvorPlanilha,
  "departamento_id" | "nome_louvor" | "cantor_banda" | "tonalidade" | "link_youtube" | "ordem_execucao"
> &
  Partial<Pick<LouvorPlanilha, "youtube_titulo" | "youtube_thumbnail" | "youtube_canal" | "tipo_louvor" | "evento_nome">>;

/** Campos que podem ser editados inline na planilha. */
export type LouvorEditavel = Pick<
  LouvorPlanilha,
  | "nome_louvor"
  | "cantor_banda"
  | "tonalidade"
  | "link_youtube"
  | "youtube_titulo"
  | "youtube_thumbnail"
  | "youtube_canal"
  | "ordem_execucao"
  | "tipo_louvor"
  | "evento_nome"
>;

/** Campos de cifra/observações, editados num painel expansível por linha. */
export type LouvorDetalhesEditavel = Pick<LouvorPlanilha, "cifra" | "observacoes">;
