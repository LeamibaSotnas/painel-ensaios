import { entrar } from "./login-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginPageProps {
  searchParams: Promise<{ erro?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { erro } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl shadow-violet-900/10 backdrop-blur-xl">
        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-lg font-bold text-white shadow-md shadow-violet-500/30">
          ♪
        </div>
        <h1 className="mt-3 bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-xl font-bold tracking-tight text-transparent">
          Painel de Ensaios
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entre com seu e-mail e senha para continuar.
        </p>

        <form action={entrar} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              E-mail
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="voce@igreja.org"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="senha" className="text-sm font-medium">
              Senha
            </label>
            <Input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {erro && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {erro}
            </p>
          )}

          <Button type="submit" className="mt-2">
            Entrar
          </Button>
        </form>
      </div>
    </main>
  );
}
