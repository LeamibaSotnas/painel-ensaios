/**
 * Utilitários para validar links do YouTube e capturar metadados
 * (título + miniatura) automaticamente via o endpoint público de oEmbed —
 * não requer chave de API e não faz download de vídeo/áudio.
 */

const PADROES_ID_YOUTUBE = [
  /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
];

/** Extrai o ID de 11 caracteres de um link do YouTube, ou `null` se não reconhecido. */
export function extrairIdYoutube(url: string): string | null {
  const limpo = url.trim();
  for (const padrao of PADROES_ID_YOUTUBE) {
    const resultado = padrao.exec(limpo);
    if (resultado) return resultado[1];
  }
  return null;
}

/** Verifica se a string é um link de vídeo do YouTube reconhecível. */
export function isLinkYoutubeValido(url: string): boolean {
  return extrairIdYoutube(url) !== null;
}

export interface MetadadosYoutube {
  titulo: string;
  thumbnail: string;
}

/**
 * Busca título e miniatura do vídeo via oEmbed público do YouTube.
 * Retorna `null` se o link for inválido ou a busca falhar (sem internet,
 * vídeo privado/removido, timeout, etc.) — o cadastro do link continua
 * funcionando normalmente mesmo sem os metadados.
 */
export async function buscarMetadadosYoutube(url: string): Promise<MetadadosYoutube | null> {
  const id = extrairIdYoutube(url);
  if (!id) return null;

  const urlCanonica = `https://www.youtube.com/watch?v=${id}`;

  try {
    const resposta = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(urlCanonica)}&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!resposta.ok) {
      return { titulo: "", thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg` };
    }
    const dados = (await resposta.json()) as { title?: string; thumbnail_url?: string };
    return {
      titulo: dados.title ?? "",
      thumbnail: dados.thumbnail_url ?? `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  } catch {
    // Sem conexão ou timeout: ainda garantimos uma miniatura padrão previsível.
    return { titulo: "", thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg` };
  }
}

export interface ResultadoBuscaYoutube {
  id: string;
  titulo: string;
  canal: string;
  thumbnail: string;
}

/**
 * Busca inteligente: usa a YouTube Data API v3 (chave em `YOUTUBE_API_KEY`)
 * para retornar os melhores resultados para um termo (nome do louvor + cantor).
 *
 * Retorna `null` quando a chave não está configurada — nesse caso o chamador
 * deve cair de volta para abrir a busca do YouTube numa nova aba. Isso mantém
 * a funcionalidade funcionando mesmo sem nenhuma configuração extra.
 */
export async function buscarVideosYoutube(query: string): Promise<ResultadoBuscaYoutube[] | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const termo = query.trim();
  if (!apiKey || !termo) return null;

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${encodeURIComponent(termo)}&key=${apiKey}`;
    const resposta = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!resposta.ok) return null;

    const dados = (await resposta.json()) as {
      items?: Array<{
        id?: { videoId?: string };
        snippet?: {
          title?: string;
          channelTitle?: string;
          thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
        };
      }>;
    };

    const itens = dados.items ?? [];
    return itens
      .filter((item) => item.id?.videoId)
      .map((item) => {
        const videoId = item.id!.videoId!;
        return {
          id: videoId,
          titulo: item.snippet?.title ?? "",
          canal: item.snippet?.channelTitle ?? "",
          thumbnail:
            item.snippet?.thumbnails?.medium?.url ??
            item.snippet?.thumbnails?.default?.url ??
            `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        };
      });
  } catch {
    return null;
  }
}
