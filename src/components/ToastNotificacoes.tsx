"use client";

import { BellRing, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface Toast {
  id: number;
  mensagem: string;
  subtexto?: string;
}

let toastIdCounter = 0;

/**
 * Exibe toasts flutuantes (canto inferior-direito) quando novas observações chegam.
 * Escuta o CustomEvent "observacao-nova" disparado por EnsaioGrid após salvar.
 * Auto-dismiss em 6 s; botão ×  fecha manualmente.
 */
export function ToastNotificacoes() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevTotalRef = useRef<number>(0);
  const initializedRef = useRef(false);

  function remover(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function adicionarToast(mensagem: string, subtexto?: string) {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev.slice(-3), { id, mensagem, subtexto }]);
    // Auto-dismiss após 6 s
    setTimeout(() => remover(id), 6000);
  }

  const verificarNovas = useCallback(async (mostrarToast: boolean) => {
    try {
      const desde = localStorage.getItem("painel-notif-visto-em") ?? undefined;
      const qs = desde ? `?desde=${encodeURIComponent(desde)}` : "";
      const res = await fetch(`/api/notificacoes${qs}`, { cache: "no-store" });
      if (!res.ok) return;
      const data: { total: number } = await res.json();
      const novas = data.total ?? 0;

      if (mostrarToast && novas > prevTotalRef.current) {
        const diff = novas - prevTotalRef.current;
        adicionarToast(
          diff === 1 ? "Nova observação publicada" : `${diff} novas observações`,
          "Verifique o mural para mais detalhes"
        );
      }
      prevTotalRef.current = novas;
    } catch {
      // silencia erros de rede
    }
  }, []);

  // Poll a cada 30 s para detectar observações de outros usuários
  useEffect(() => {
    // Carrega o total inicial sem mostrar toast (baseline)
    verificarNovas(false).then(() => {
      initializedRef.current = true;
    });
    const id = setInterval(() => {
      if (initializedRef.current) verificarNovas(true);
    }, 30_000);
    return () => clearInterval(id);
  }, [verificarNovas]);

  // Quando o próprio painel salva uma observação, re-verifica imediatamente e mostra toast
  useEffect(() => {
    const handler = () => {
      // Pequeno delay para a API receber a gravação
      setTimeout(() => verificarNovas(true), 800);
    };
    window.addEventListener("observacao-nova", handler);
    return () => window.removeEventListener("observacao-nova", handler);
  }, [verificarNovas]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 right-4 z-[9999] flex flex-col gap-2 sm:bottom-6 sm:right-6"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "relative flex w-72 items-start gap-3 overflow-hidden rounded-2xl border border-white/20 p-4 shadow-2xl",
            "sm:w-80"
          )}
          style={{
            background:
              "linear-gradient(135deg, rgba(12,8,35,0.97) 0%, rgba(25,15,70,0.97) 60%, rgba(40,10,55,0.97) 100%)",
            animation: "card-enter 0.3s cubic-bezier(0.34,1.2,0.64,1) both",
          }}
        >
          {/* Ícone */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md"
            style={{
              background: "linear-gradient(135deg,#f59e0b,#ea580c)",
              boxShadow: "0 4px 12px -4px rgba(245,158,11,0.55)",
            }}
          >
            <BellRing className="h-4 w-4 text-white" style={{ animation: "bell-ring 1.2s ease-in-out both" }} />
          </div>

          {/* Texto */}
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-bold text-white">{toast.mensagem}</p>
            {toast.subtexto && (
              <p className="mt-0.5 text-[11px] text-white/50">{toast.subtexto}</p>
            )}
          </div>

          {/* Fechar */}
          <button
            onClick={() => remover(toast.id)}
            className="ml-1 shrink-0 rounded-lg p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Barra de progresso */}
          <div
            className="absolute bottom-0 left-0 h-[3px] rounded-full"
            style={{
              background: "linear-gradient(90deg,#f59e0b,#ea580c)",
              animation: "toast-progress 6s linear forwards",
              width: "100%",
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default ToastNotificacoes;
