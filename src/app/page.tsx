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

      {/* Card glassmorphism — vidro fosco sobre o Arctic Wave */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/30 bg-white/10 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">

        {/* Frase devocional — aparece uma única vez, discreta e em destaque */}
        <div className="mb-6 text-center">
          <p
            className="text-lg font-medium italic text-[#F5D77A]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Glórias e honras
          </p>
          <p
            className="text-sm italic tracking-wide text-[#F5D77A]/85"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            a Ti Senhor Jesus
          </p>
          <div className="mx-auto mt-2 h-px w-14 bg-[#F5D77A]/55" />
        </div>

        {/* Ícone */}
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-600 to-purple-700 text-xl font-bold text-white shadow-md shadow-purple-700/40">
          ♪
        </div>

        <h1 className="text-2xl font-bold text-white">Painel de Ensaios</h1>
        <p className="mb-6 mt-1 text-sm text-white/70">
          Entre com seu e-mail e senha para continuar.
        </p>

        <LoginForm erro={erro} onSubmit={entrar} />
      </div>
    </main>
  );
}
