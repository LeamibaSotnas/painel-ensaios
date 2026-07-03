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
