import { LoginForm } from "@/components/LoginForm";
import { entrar } from "./login-actions";

interface LoginPageProps {
  searchParams: Promise<{ erro?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { erro } = await searchParams;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Aurora: ondas de luz animadas com movimento suave */}
      <div className="aurora-login" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/60 bg-white/85 p-8 shadow-2xl shadow-violet-900/20 backdrop-blur-2xl">
        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-lg font-bold text-white shadow-md shadow-violet-500/30">
          ♪
        </div>
        <h1 className="mt-3 bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-xl font-bold tracking-tight text-transparent">
          Painel de Ensaios
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entre com seu e-mail e senha para continuar.
        </p>

        <LoginForm erro={erro} onSubmit={entrar} />
      </div>
    </main>
  );
}
