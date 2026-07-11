"use client";

/**
 * MorphBackground — formas geométricas suaves animadas em CSS puro.
 * GPU-acelerado: usa apenas `transform` e `opacity` (sem layout thrashing).
 * Posicionamento `absolute` — coloque em um `relative overflow-hidden`.
 */
export function MorphBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Blob 1 — violeta grande, deriva lento */}
      <div
        className="absolute"
        style={{
          width: "60%", height: "60%", top: "-20%", left: "-12%",
          background: "radial-gradient(ellipse at center, rgba(139,92,246,0.22) 0%, rgba(139,92,246,0) 70%)",
          borderRadius: "60% 40% 55% 45% / 50% 60% 40% 55%",
          animation: "morph-drift-a 16s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Blob 2 — fuchsia, direita */}
      <div
        className="absolute"
        style={{
          width: "50%", height: "55%", top: "25%", right: "-10%",
          background: "radial-gradient(ellipse at center, rgba(217,70,239,0.18) 0%, rgba(217,70,239,0) 70%)",
          borderRadius: "45% 55% 40% 60% / 55% 45% 60% 40%",
          animation: "morph-drift-b 20s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Blob 3 — âmbar dourado, baixo esquerdo */}
      <div
        className="absolute"
        style={{
          width: "35%", height: "38%", bottom: "-8%", left: "18%",
          background: "radial-gradient(ellipse at center, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0) 70%)",
          borderRadius: "55% 45% 60% 40% / 40% 60% 45% 55%",
          animation: "morph-drift-c 24s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Blob 4 — sky topo direito, pulsa */}
      <div
        className="absolute"
        style={{
          width: "42%", height: "44%", top: "3%", right: "12%",
          background: "radial-gradient(ellipse at center, rgba(14,165,233,0.14) 0%, rgba(14,165,233,0) 70%)",
          borderRadius: "40% 60% 50% 50% / 60% 40% 55% 45%",
          animation: "morph-drift-d 18s ease-in-out infinite",
          willChange: "transform, opacity",
        }}
      />

      {/* Blob 5 — centro pulsante — destaque sutil */}
      <div
        className="absolute"
        style={{
          width: "40%", height: "40%", top: "25%", left: "30%",
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 65%)",
          borderRadius: "50%",
          animation: "morph-pulse-center 5s ease-in-out infinite",
          willChange: "transform, opacity",
        }}
      />

      {/* Luz sweep — brilho diagonal que varre o card ocasionalmente */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.06) 50%, transparent 65%)",
          animation: "light-sweep 8s ease-in-out infinite 2s",
          willChange: "transform",
        }}
      />
    </div>
  );
}
