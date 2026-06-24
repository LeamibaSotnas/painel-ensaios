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
