"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type TipoToast = "sucesso" | "erro";

interface ToastItem {
  id: number;
  tipo: TipoToast;
  titulo: string;
  descricao?: string;
}

interface ToastContextValue {
  toast: (novo: Omit<ToastItem, "id">) => void;
}

const DURACAO_MS = 5000;

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error("useToast precisa ser usado dentro de <ToastProvider>.");
  }
  return contexto;
}

/**
 * Avisos rápidos (toasts) no canto da tela: somem sozinhos depois de alguns
 * segundos e podem ser fechados à mão. A região `aria-live` fica sempre no DOM
 * para leitores de tela anunciarem o aviso quando ele aparece.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const proximoId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const remover = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((atuais) => atuais.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (novo: Omit<ToastItem, "id">) => {
      const id = ++proximoId.current;
      setToasts((atuais) => [...atuais, { id, ...novo }]);
      timers.current.set(
        id,
        setTimeout(() => remover(id), DURACAO_MS),
      );
    },
    [remover],
  );

  useEffect(() => {
    const pendentes = timers.current;
    return () => pendentes.forEach((timer) => clearTimeout(timer));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((item) => {
          const Icone = item.tipo === "sucesso" ? CheckCircle2 : CircleAlert;

          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border-2 bg-white p-3.5 shadow-lg",
                item.tipo === "sucesso" ? "border-status-success-fg" : "border-destructive",
              )}
            >
              <Icone
                className={cn(
                  "mt-0.5 h-5 w-5 shrink-0",
                  item.tipo === "sucesso" ? "text-status-success-fg" : "text-destructive",
                )}
                aria-hidden="true"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="font-semibold text-foreground">{item.titulo}</p>
                {item.descricao && <p className="text-sm text-muted-foreground">{item.descricao}</p>}
              </div>
              <button
                type="button"
                onClick={() => remover(item.id)}
                aria-label="Fechar aviso"
                className="shrink-0 rounded-full p-1 text-muted-dark opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
