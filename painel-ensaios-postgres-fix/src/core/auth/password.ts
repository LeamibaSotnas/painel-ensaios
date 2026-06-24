import bcrypt from "bcryptjs";

const CUSTO_HASH = 10;

/** Gera o hash de uma senha em texto puro para armazenar em `usuarios.senha_hash`. */
export function hashSenha(senha: string): string {
  return bcrypt.hashSync(senha, CUSTO_HASH);
}

/** Compara uma senha em texto puro com o hash salvo no banco. */
export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}
