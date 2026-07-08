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
      {/* Forma 1 — elipse grande violeta, deriva lentamente */}
      <div
        className="absolute"
        style={{
          width: "55%",
          height: "55%",
          top: "-15%",
          left: "-10%",
          background:
            "radial-gradient(ellipse at center, rgba(139,92,246,0.13) 0%, rgba(139,92,246,0) 70%)",
          borderRadius: "60% 40% 55% 45% / 50% 60% 40% 55%",
          animation: "morph-drift-a 18s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Forma 2 — elipse fuchsia, deriva em direção oposta */}
      <div
        className="absolute"
        style={{
          width: "45%",
          height: "50%",
          top: "30%",
          right: "-8%",
          background:
            "radial-gradient(ellipse at center, rgba(217,70,239,0.10) 0%, rgba(217,70,239,0) 70%)",
          borderRadius: "45% 55% 40% 60% / 55% 45% 60% 40%",
          animation: "morph-drift-b 22s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Forma 3 — blob âmbar pequeno, canto inferior esquerdo */}
      <div
        className="absolute"
        style={{
          width: "30%",
          height: "35%",
          bottom: "-5%",
          left: "20%",
          background:
            "radial-gradient(ellipse at center, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0) 70%)",
          borderRadius: "55% 45% 60% 40% / 40% 60% 45% 55%",
          animation: "morph-drift-c 26s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Forma 4 — blob sky topo direito, pulsa com opacidade */}
      <div
        className="absolute"
        style={{
          width: "38%",
          height: "42%",
          top: "5%",
          right: "15%",
          background:
            "radial-gradient(ellipse at center, rgba(14,165,233,0.07) 0%, rgba(14,165,233,0) 70%)",
          borderRadius: "40% 60% 50% 50% / 60% 40% 55% 45%",
          animation: "morph-drift-d 20s ease-in-out infinite",
          willChange: "transform, opacity",
        }}
      />

      <style>{`
        @keyframes morph-drift-a {
          0%   { transform: translate(0px, 0px) rotate(0deg) scale(1); }
          33%  { transform: translate(18px, 14px) rotate(4deg) scale(1.04); }
          66%  { transform: translate(-10px, 22px) rotate(-3deg) scale(0.97); }
          100% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
        }
        @keyframes morph-drift-b {
          0%   { transform: translate(0px, 0px) rotate(0deg) scale(1); }
          40%  { transform: translate(-20px, -12px) rotate(-5deg) scale(1.06); }
          70%  { transform: translate(14px, -20px) rotate(3deg) scale(0.96); }
          100% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
        }
        @keyframes morph-drift-c {
          0%   { transform: translate(0px, 0px) scale(1); opacity: 1; }
          50%  { transform: translate(16px, -18px) scale(1.08); opacity: 0.7; }
          100% { transform: translate(0px, 0px) scale(1); opacity: 1; }
        }
        @keyframes morph-drift-d {
          0%   { transform: translate(0px, 0px) rotate(0deg); opacity: 0.8; }
          35%  { transform: translate(-14px, 16px) rotate(6deg); opacity: 1; }
          70%  { transform: translate(10px, -10px) rotate(-4deg); opacity: 0.65; }
          100% { transform: translate(0px, 0px) rotate(0deg); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
