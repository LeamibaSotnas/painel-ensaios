import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { UsuariosTable, type NovoUsuarioInput, type UsuarioEditavel } from "@/components/UsuariosTable";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import { hashSenha } from "@/core/auth/password";
import {
  atualizarUsuario,
  criarUsuario,
  emailJaExiste,
  listarUsuarios,
  removerUsuario,
} from "@/core/db/queries";

const CAMINHO_USUARIOS = "/dashboard/usuarios";

export default async function UsuariosPage() {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) {
    redirect("/");
  }
  if (usuarioAtual.regra !== "ADMIN") {
    redirect("/dashboard");
  }

  const usuarioAtualId = usuarioAtual.id;
  const usuarios = listarUsuarios();

  async function handleAtualizarUsuario(id: string, valores: UsuarioEditavel) {
    "use server";
    atualizarUsuario(id, valores);
    revalidatePath(CAMINHO_USUARIOS);
  }

  async function handleRemoverUsuario(id: string) {
    "use server";
    if (id === usuarioAtualId) {
      throw new Error("Você não pode remover sua própria conta.");
    }
    removerUsuario(id);
    revalidatePath(CAMINHO_USUARIOS);
  }

  async function handleCriarUsuario(valores: NovoUsuarioInput) {
    "use server";
    if (emailJaExiste(valores.email)) {
      throw new Error("Já existe um usuário com esse e-mail.");
    }
    criarUsuario({
      nome: valores.nome,
      email: valores.email,
      senhaHash: hashSenha(valores.senha),
      regra: valores.regra,
    });
    revalidatePath(CAMINHO_USUARIOS);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie quem tem acesso ao painel e em qual nível.
        </p>
      </header>

      <UsuariosTable
        data={usuarios}
        usuarioAtualId={usuarioAtualId}
        onAtualizarUsuario={handleAtualizarUsuario}
        onRemoverUsuario={handleRemoverUsuario}
        onCriarUsuario={handleCriarUsuario}
      />
    </div>
  );
}
