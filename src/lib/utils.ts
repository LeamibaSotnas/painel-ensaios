import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Helper padrão gerado pelo `shadcn` CLI (mantido aqui apenas para
 * este componente compilar de forma isolada). Se o projeto já tiver
 * `src/lib/utils.ts`, descarte este arquivo.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
