import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { UsuariosTable, type NovoUsuarioInput, type UsuarioEditavel } from "@/components/UsuariosTable";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import { hashSenha } from "@/core/auth/password";
import {
  atualizarUsuario,
  criarUsuario,
  emailJaExiste,
  listarDepartamentos,
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
  const usuarios = await listarUsuarios();
  const departamentos = await listarDepartamentos();

  async function handleAtualizarUsuario(id: string, valores: UsuarioEditavel) {
    "use server";
    if (valores.regra !== "ADMIN" && !valores.departamentoId) {
      throw new Error("Selecione um departamento para esse usuário.");
    }
    await atualizarUsuario(id, valores);
    revalidatePath(CAMINHO_USUARIOS);
  }

  async function handleRemoverUsuario(id: string) {
    "use server";
    if (id === usuarioAtualId) {
      throw new Error("Você não pode remover sua própria conta.");
    }
    await removerUsuario(id);
    revalidatePath(CAMINHO_USUARIOS);
  }

  async function handleCriarUsuario(valores: NovoUsuarioInput) {
    "use server";
    if (await emailJaExiste(valores.email)) {
      throw new Error("Já existe um usuário com esse e-mail.");
    }
    if (valores.regra !== "ADMIN" && !valores.departamentoId) {
      throw new Error("Selecione um departamento para esse usuário.");
    }
    await criarUsuario({
      nome: valores.nome,
      email: valores.email,
      senhaHash: hashSenha(valores.senha),
      regra: valores.regra,
      departamentoId: valores.departamentoId,
    });
    revalidatePath(CAMINHO_USUARIOS);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-amber-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          Usuários
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie os usuários que têm acesso ao painel.
        </p>
      </header>

      <UsuariosTable
        data={usuarios}
        departamentos={departamentos}
        usuarioAtualId={usuarioAtualId}
        onAtualizarUsuario={handleAtualizarUsuario}
        onRemoverUsuario={handleRemoverUsuario}
        onCriarUsuario={handleCriarUsuario}
      />
    </div>
  );
}
