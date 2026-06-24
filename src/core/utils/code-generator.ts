/**
 * Geração do código sequencial codificado por departamento.
 * Ex.: prefixo "SA" + maior número já usado -> "SA4"
 *
 * Formato: PREFIXO + número (sem hífen, sem zero-padding), para bater
 * com a convenção usada na organização (SA1, SA2... AD1, AD2... etc.).
 *
 * Mantido como função pura (sem I/O) para ser fácil de testar e
 * reutilizar tanto no cliente quanto no servidor (camada SQLite local).
 */

const CODE_REGEX = /^([A-Z]+)(\d+)$/;

/**
 * Extrai o número sequencial de um código existente.
 * Retorna null se o código não seguir o padrão PREFIXO+número.
 */
export function parseSequentialNumber(
  codigo: string,
  prefixoEsperado?: string
): number | null {
  const match = CODE_REGEX.exec(codigo.trim().toUpperCase());
  if (!match) return null;

  const [, prefixo, numero] = match;
  if (prefixoEsperado && prefixo !== prefixoEsperado.toUpperCase()) {
    return null;
  }
  return Number.parseInt(numero, 10);
}

/**
 * Calcula o próximo código sequencial para um departamento, dado o
 * seu prefixo e a lista de códigos já existentes (de qualquer
 * departamento — a função filtra internamente pelo prefixo).
 *
 * @example
 * gerarProximoCodigo("SA", ["SA1", "SA2", "AD1"])
 * // -> "SA3"
 */
export function gerarProximoCodigo(
  prefixo: string,
  codigosExistentes: string[]
): string {
  const prefixoNormalizado = prefixo.trim().toUpperCase();

  const maiorNumero = codigosExistentes.reduce((maior, codigo) => {
    const numero = parseSequentialNumber(codigo, prefixoNormalizado);
    return numero !== null && numero > maior ? numero : maior;
  }, 0);

  const proximoNumero = maiorNumero + 1;
  return formatarCodigo(prefixoNormalizado, proximoNumero);
}

/** Formata prefixo + número, sem separador e sem zero-padding (ex.: "SA", 4 -> "SA4"). */
export function formatarCodigo(prefixo: string, numero: number): string {
  return `${prefixo.trim().toUpperCase()}${numero}`;
}

/** Valida se uma string já está no formato de código sequencial esperado. */
export function isCodigoValido(codigo: string): boolean {
  return COD