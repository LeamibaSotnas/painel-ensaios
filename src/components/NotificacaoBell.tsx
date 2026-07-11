"use client";

import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const LS_KEY = "painel-notif-visto-em";
const POLL_MS = 30_000;

/**
 * Sino de notificações — exibe badge animado com a contagem de observações
 * novas (global + do departamento do usuário) usando polling a cada 30 s.
 */
export function NotificacaoBell() {
  const [total, setTotal] = useState(0);

  const buscar = useCallback(async () => {
    try {
      const desde = localStorage.getItem(LS_KEY) ?? undefined;
      const qs = desde ? `?desde=${encodeURIComponent(desde)}` : "";
      const res = await fetch(`/api/notificacoes${qs}`, { cache: "no-store" });
      if (res.ok) {
        const data: { total: number } = await res.json();
        setTotal(data.total ?? 0);
      }
    } catch {
      // silencia erros de rede
    }
  }, []);

  useEffect(() => {
    buscar();
    const id = setInterval(buscar, POLL_MS);
    return () => clearInterval(id);
  }, [buscar]);

  // Quando qualquer painel salva uma observação, re-faz poll imediatamente
  useEffect(() => {
    const handler = () => buscar();
    window.addEventListener("observacao-nova", handler);
    return () => window.removeEventListener("observacao-nova", handler);
  }, [buscar]);

  function marcarVisto() {
    localStorage.setItem(LS_KEY, new Date().toISOString());
    setTotal(0);
  }

  return (
    <button
      onClick={marcarVisto}
      title={total > 0 ? `${total} nova(s) observação(ões)` : "Notificações em dia"}
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-full",
        "transition-all duration-200 hover:bg-white/15 active:scale-90",
        total > 0 ? "text-amber-300" : "text-white/55"
      )}
    >
      {/* Ícone — balança quando há notificações */}
      <Bell
        className={cn(
          "h-4 w-4 transition-all duration-300",
          total > 0 && "drop-shadow-[0_0_6px_rgba(251,191,36,0.85)]"
        )}
        style={
          total > 0
            ? { animation: "bell-ring 1.4s ease-in-out infinite 0.5s" }
            : undefined
        }
      />

      {/* Badge com contagem */}
      {total > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-black leading-4 text-white shadow-md shadow-red-600/40"
          style={{ animation: "badge-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
        >
          {total > 9 ? "9+" : total}
        </span>
      )}
    </button>
  );
}

export default NotificacaoBell;
