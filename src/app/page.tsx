import { LoginForm } from "@/components/LoginForm";
import { entrar } from "./login-actions";

interface LoginPageProps {
  searchParams: Promise<{ erro?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { erro } = await searchParams;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#4F46E5] p-4">

      {/* ── Formas geométricas de fundo ────────────────────────────────────── */}
      {/* Círculo grande — canto superior esquerdo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -top-10 h-[360px] w-[360px] rounded-full bg-white/[0.07]"
      />
      {/* Círculo grande — canto inferior direito */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-10 h-[460px] w-[460px] rounded-full bg-white/[0.07]"
      />
      {/* Quadrado rotacionado — topo direito */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[70px] top-[60px] h-[110px] w-[110px] rotate-[18deg] rounded-md border border-white/20"
      />
      {/* Linhas onduladas SVG */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
        preserveAspectRatio="none"
      >
        <path
          d="M0 330 C 180 380, 340 300, 500 350 S 680 300, 680 300"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.16"
          strokeWidth="1.5"
        />
        <path
          d="M0 300 C 200 250, 380 420, 680 340"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.10"
          strokeWidth="1"
        />
      </svg>

      {/* ── Card glassmorphism ──────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/30 bg-white/10 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">

        {/* Frase devocional */}
        <div className="mb-5 text-center">
          <p
            className="mb-1 text-sm italic tracking-wide text-[#F3E4B8]/85"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Glórias e honras a Ti
          </p>
          <p
            className="text-4xl font-bold italic leading-none"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              background: "linear-gradient(180deg, #FFF3C4 0%, #F5C242 45%, #B8860B 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 1px 2px rgba(139,101,8,0.45))",
            }}
          >
            Senhor Jesus
          </p>
          <div className="mx-auto mt-2 h-px w-16 bg-[#F5C242]/60" />
        </div>

        {/* Ícone */}
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-2xl font-bold text-white shadow-md shadow-purple-700/40">
          ♪
        </div>

        <h1 className="text-2xl font-bold text-white">Painel de Ensaios</h1>
        <p className="mb-6 mt-1 text-sm text-white/80">
          Entre com seu e-mail e senha para continuar.
        </p>

        <LoginForm erro={erro} onSubmit={entrar} />
      </div>
    </main>
  );
}
