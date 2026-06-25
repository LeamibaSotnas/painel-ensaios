import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { UsuariosTable, type NovoUsuarioInput, type UsuarioEditavel } from "@/components/UsuariosTable";
import { getUsuarioAtual } from "@/core/auth/get-usuario-atual";
import { hashSenha } from "@/core/auth/password";
import { ehAdminDePainel, ehSuperAdmin, podeGerenciarUsuarios, regrasAtribuiveis } from "@/core/auth/permissoes";
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
  if (!podeGerenciarUsuarios(usuarioAtual)) {
    redirect("/dashboard");
  }

  const usuarioAtualId = usuarioAtual.id;
  const meuDepartamentoId = usuarioAtual.departamento_id;
  const restritoAoProprioDepartamento = ehAdminDePainel(usuarioAtual);

  const todosUsuarios = await listarUsuarios();
  const todosDepartamentos = await listarDepartamentos();

  // Administrador de Painel só vê/gerencia usuários e o departamento que lhe pertence.
  const usuarios = restritoAoProprioDepartamento
    ? todosUsuarios.filter((u) => u.departamento_id === meuDepartamentoId)
    : todosUsuarios;
  const departamentos = restritoAoProprioDepartamento
    ? todosDepartamentos.filter((d) => d.id === meuDepartamentoId)
    : todosDepartamentos;
  const regrasPermitidas = regrasAtribuiveis(usuarioAtual);

  /**
   * Garante que um Admin de Painel só opere sobre usuários/papéis do próprio
   * departamento. Retorna a mensagem de erro (em vez de lançar) porque erros
   * lançados dentro de Server Actions chegam mascarados ao cliente em
   * produção ("An error occurred in the Server Components render...").
   */
  function validarEscopoAdminPainel(valores: {
    regra: string;
    departamentoId: string | null;
  }): string | null {
    if (!restritoAoProprioDepartamento) return null;
    if (valores.regra === "ADMIN" || valores.regra === "ADMIN_PAINEL") {
      return "Você não tem permissão para atribuir esse papel.";
    }
    if (valores.departamentoId !== meuDepartamentoId) {
      return "Você só pode gerenciar usuários do seu próprio departamento.";
    }
    return null;
  }

  async function handleAtualizarUsuario(
    id: string,
    valores: UsuarioEditavel
  ): Promise<{ erro?: string }> {
    "use server";
    if (valores.regra !== "ADMIN" && !valores.departamentoId) {
      return { erro: "Selecione um departamento para esse usuário." };
    }
    if (restritoAoProprioDepartamento) {
      const alvo = todosUsuarios.find((u) => u.id === id);
      if (!alvo || alvo.departamento_id !== meuDepartamentoId) {
        return { erro: "Você só pode gerenciar usuários do seu próprio departamento." };
      }
      const erroEscopo = validarEscopoAdminPainel(valores);
      if (erroEscopo) return { erro: erroEscopo };
    }
    try {
      await atualizarUsuario(id, valores);
    } catch (erro) {
      return { erro: erro instanceof Error ? erro.message : "Falha ao salvar no banco de dados." };
    }
    revalidatePath(CAMINHO_USUARIOS);
    return {};
  }

  async function handleRemoverUsuario(id: string): Promise<{ erro?: string }> {
    "use server";
    if (id === usuarioAtualId) {
      return { erro: "Você não pode remover sua própria conta." };
    }
    if (restritoAoProprioDepartamento) {
      const alvo = todosUsuarios.find((u) => u.id === id);
      if (!alvo || alvo.departamento_id !== meuDepartamentoId) {
        return { erro: "Você só pode remover usuários do seu próprio departamento." };
      }
    }
    try {
      await removerUsuario(id);
    } catch (erro) {
      return { erro: erro instanceof Error ? erro.message : "Falha ao remover no banco de dados." };
    }
    revalidatePath(CAMINHO_USUARIOS);
    return {};
  }

  async function handleCriarUsuario(valores: NovoUsuarioInput): Promise<{ erro?: string }> {
    "use server";
    try {
      if (await emailJaExiste(valores.email)) {
        return { erro: "Já existe um usuário com esse e-mail." };
      }
    } catch (erro) {
      return {
        erro: erro instanceof Error ? `Falha ao verificar e-mail: ${erro.message}` : "Falha ao verificar e-mail.",
      };
    }
    if (valores.regra !== "ADMIN" && !valores.departamentoId) {
      return { erro: "Selecione um departamento para esse usuário." };
    }
    if (restritoAoProprioDepartamento) {
      const erroEscopo = validarEscopoAdminPainel(valores);
      if (erroEscopo) return { erro: erroEscopo };
    }
    try {
      await criarUsuario({
        nome: valores.nome,
        email: valores.email,
        senhaHash: hashSenha(valores.senha),
        regra: valores.regra,
        departamentoId: valores.departamentoId,
      });
    } catch (erro) {
      return { erro: erro instanceof Error ? erro.message : "Falha ao criar no banco de dados." };
    }
    revalidatePath(CAMINHO_USUARIOS);
    return {};
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-amber-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          Usuários
        </h1>
        <p className="text-sm text-muted-foreground">
          {ehSuperAdmin(usuarioAtual)
            ? "Gerencie os usuários que têm acesso ao painel."
            : "Gerencie os usuários do seu departamento."}
        </p>
      </header>

      <UsuariosTable
        data={usuarios}
        departamentos={departamentos}
        usuarioAtualId={usuarioAtualId}
        regrasPermitidas={regrasPermitidas}
        onAtualizarUsuario={handleAtualizarUsuario}
        onRemoverUsuario={handleRemoverUsuario}
        onCriarUsuario={handleCriarUsuario}
      />
    </div>
  );
}
