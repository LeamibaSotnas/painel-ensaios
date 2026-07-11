/**
 * Retorna o tema de cores de um departamento (gradientes, cores primárias).
 * Usado para estilizar modais, painéis expansíveis e formulários de cada grupo.
 */
export interface TemaDepartamento {
  /** Gradiente CSS suave para fundo de painéis/modais */
  gradiente: string;
  /** Gradiente vivo para header/barra do modal */
  gradienteVivo: string;
  /** Cor primary (rgba) para bordas e accents */
  cor: string;
  /** Cor da borda superior do painel expansível */
  borda: string;
  /** Cor do texto sobre o gradiente vivo */
  textoHeader: string;
  /** Cor para o botão "Abrir no YouTube" / hover items */
  accent: string;
}

export function temaDoDepartamento(nome: string): TemaDepartamento {
  const n = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // ROSA DE SARON (Irmas) — rose / pink
  if (/irma|rosa|saron/.test(n))
    return {
      gradiente: "linear-gradient(145deg, rgba(244,63,94,0.08) 0%, rgba(236,72,153,0.05) 100%)",
      gradienteVivo: "linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)",
      cor: "rgba(244,63,94,0.55)",
      borda: "rgba(244,63,94,0.4)",
      textoHeader: "#fff",
      accent: "#be123c",
    };

  // SOM DE ADORADORES (Jovens) — blue / sky
  if (/jovem|jovens|som|adorador/.test(n))
    return {
      gradiente: "linear-gradient(145deg, rgba(59,130,246,0.09) 0%, rgba(14,165,233,0.05) 100%)",
      gradienteVivo: "linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)",
      cor: "rgba(59,130,246,0.55)",
      borda: "rgba(59,130,246,0.4)",
      textoHeader: "#fff",
      accent: "#1d4ed8",
    };

  // HEROIS DA FE (Adolescentes) — orange / amber
  if (/adolescen|hero|heroi/.test(n))
    return {
      gradiente: "linear-gradient(145deg, rgba(249,115,22,0.09) 0%, rgba(245,158,11,0.05) 100%)",
      gradienteVivo: "linear-gradient(135deg, #f97316 0%, #f59e0b 100%)",
      cor: "rgba(249,115,22,0.55)",
      borda: "rgba(249,115,22,0.4)",
      textoHeader: "#fff",
      accent: "#c2410c",
    };

  // JARDIM DE DEUS (Criancas) — green / emerald
  if (/crian|jardim/.test(n))
    return {
      gradiente: "linear-gradient(145deg, rgba(34,197,94,0.09) 0%, rgba(16,185,129,0.05) 100%)",
      gradienteVivo: "linear-gradient(135deg, #22c55e 0%, #10b981 100%)",
      cor: "rgba(34,197,94,0.55)",
      borda: "rgba(34,197,94,0.4)",
      textoHeader: "#fff",
      accent: "#15803d",
    };

  // SHEKNA (Orquestra) — purple / violet
  if (/orquestra|shekna|shekin/.test(n))
    return {
      gradiente: "linear-gradient(145deg, rgba(147,51,234,0.10) 0%, rgba(124,58,237,0.05) 100%)",
      gradienteVivo: "linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)",
      cor: "rgba(147,51,234,0.55)",
      borda: "rgba(147,51,234,0.4)",
      textoHeader: "#fff",
      accent: "#7e22ce",
    };

  // FRUTOS DA PROMESSA (Banda/Cozinha) — amber / gold
  if (/banda|cozinha|fruto|promessa/.test(n))
    return {
      gradiente: "linear-gradient(145deg, rgba(245,158,11,0.10) 0%, rgba(234,179,8,0.05) 100%)",
      gradienteVivo: "linear-gradient(135deg, #f59e0b 0%, #eab308 100%)",
      cor: "rgba(245,158,11,0.55)",
      borda: "rgba(245,158,11,0.4)",
      textoHeader: "#78350f",
      accent: "#92400e",
    };

  // Default — violet / fuchsia
  return {
    gradiente: "linear-gradient(145deg, rgba(139,92,246,0.09) 0%, rgba(168,85,247,0.05) 100%)",
    gradienteVivo: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
    cor: "rgba(139,92,246,0.55)",
    borda: "rgba(139,92,246,0.4)",
    textoHeader: "#fff",
    accent: "#6d28d9",
  };
}

/* ─── Funções para o visual escuro da página de departamento ─────────────── */

function normalizar(nome: string) {
  return nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Gradiente escuro exclusivo por departamento —
 * usado como fundo da área de conteúdo abaixo do banner.
 */
export function gradienteDoDepartamento(nome: string): string {
  const n = normalizar(nome);
  // Jardim de Deus — verde floresta profundo
  if (/crian|jardim/.test(n))
    return "linear-gradient(160deg,#030f06 0%,#0a2e14 45%,#163d22 100%)";
  // Som de Adoradores — azul elétrico / violeta cósmico
  if (/jovem|jovens|som|adorador/.test(n))
    return "linear-gradient(160deg,#03030f 0%,#08083a 45%,#15084a 100%)";
  // Rosa de Saron — rubi / magenta profundo
  if (/irma|rosa|saron/.test(n))
    return "linear-gradient(160deg,#120408 0%,#350a22 45%,#1e0416 100%)";
  // Herois da Fe — âmbar ardente / carvão
  if (/adolescen|hero|heroi/.test(n))
    return "linear-gradient(160deg,#110600 0%,#3a1000 45%,#1e0a00 100%)";
  // Shekna — vinho dourado / noir
  if (/orquestra|shekna|shekin/.test(n))
    return "linear-gradient(160deg,#0c0507 0%,#2a0d1a 45%,#140610 100%)";
  // Frutos da Promessa — azul cobalto profundo
  if (/banda|cozinha|fruto|promessa/.test(n))
    return "linear-gradient(160deg,#010610 0%,#041535 45%,#071a3a 100%)";
  return "linear-gradient(160deg,#07071a 0%,#14143a 100%)";
}

/**
 * CSS de holofotes de luz coloridos sobrepostos ao banner do departamento.
 * Simula efeitos de palco / luz solar sobre a foto do grupo.
 */
export function luzDoBanner(nome: string): string {
  const n = normalizar(nome);
  // Jardim de Deus — esmeralda + sol dourado
  if (/crian|jardim/.test(n))
    return [
      "radial-gradient(ellipse 45% 70% at 15% 10%, rgba(52,211,153,0.55), transparent 55%)",
      "radial-gradient(ellipse 35% 55% at 85% 20%, rgba(251,191,36,0.40), transparent 55%)",
      "radial-gradient(ellipse 30% 50% at 50% 90%, rgba(16,185,129,0.30), transparent 55%)",
    ].join(",");
  // Som de Adoradores — roxo elétrico + azul neon
  if (/jovem|jovens|som|adorador/.test(n))
    return [
      "radial-gradient(ellipse 45% 70% at 20%  5%, rgba(139,92,246,0.65),  transparent 55%)",
      "radial-gradient(ellipse 35% 55% at 80% 15%, rgba(59,130,246,0.55),  transparent 55%)",
      "radial-gradient(ellipse 25% 40% at 60% 85%, rgba(192,132,252,0.40), transparent 55%)",
    ].join(",");
  // Rosa de Saron — rosa vibrante + magenta
  if (/irma|rosa|saron/.test(n))
    return [
      "radial-gradient(ellipse 45% 70% at 15% 10%, rgba(244,114,182,0.65), transparent 55%)",
      "radial-gradient(ellipse 35% 55% at 80% 20%, rgba(236,72,153,0.50),  transparent 55%)",
      "radial-gradient(ellipse 25% 40% at 50% 90%, rgba(168,85,247,0.35),  transparent 55%)",
    ].join(",");
  // Herois da Fe — vermelho / laranja ardente
  if (/adolescen|hero|heroi/.test(n))
    return [
      "radial-gradient(ellipse 45% 70% at 20%  5%, rgba(239,68,68,0.60),  transparent 55%)",
      "radial-gradient(ellipse 35% 55% at 80% 20%, rgba(249,115,22,0.55), transparent 55%)",
      "radial-gradient(ellipse 25% 40% at 50% 85%, rgba(251,191,36,0.40), transparent 55%)",
    ].join(",");
  // Shekna — dourado / bordo palco
  if (/orquestra|shekna|shekin/.test(n))
    return [
      "radial-gradient(ellipse 45% 70% at 25%  5%, rgba(251,191,36,0.60),  transparent 55%)",
      "radial-gradient(ellipse 35% 55% at 75% 20%, rgba(217,119,6,0.50),   transparent 55%)",
      "radial-gradient(ellipse 25% 40% at 55% 90%, rgba(245,158,11,0.35),  transparent 55%)",
    ].join(",");
  // Frutos da Promessa — cobalto + ciano
  if (/banda|cozinha|fruto|promessa/.test(n))
    return [
      "radial-gradient(ellipse 45% 70% at 15%  5%, rgba(59,130,246,0.65),  transparent 55%)",
      "radial-gradient(ellipse 35% 55% at 80% 15%, rgba(6,182,212,0.55),   transparent 55%)",
      "radial-gradient(ellipse 25% 40% at 50% 90%, rgba(99,102,241,0.40),  transparent 55%)",
    ].join(",");
  // fallback — violeta
  return "radial-gradient(ellipse 40% 60% at 20% 10%, rgba(139,92,246,0.55), transparent 55%)";
}
