/**
 * Gera um slug de URL a partir do nome do departamento (ex.: "Crianças" -> "criancas").
 * Usado apenas no momento da criação — o slug não muda se o nome for editado depois,
 * para não quebrar links já salvos/favoritados.
 */
export function gerarSlug(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (marcas diacríticas combinantes)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
