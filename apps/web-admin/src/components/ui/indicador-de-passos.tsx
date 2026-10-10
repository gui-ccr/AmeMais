import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface IndicadorDePassosProps {
  /** Títulos das etapas, na ordem. */
  passos: readonly string[];
  /** Índice (a partir de 0) da etapa em que a pessoa está. */
  passoAtual: number;
}

/** Indicador de etapas de um formulário em wizard: concluídas com ✓, a atual destacada, as próximas apagadas. */
export function IndicadorDePassos({ passos, passoAtual }: IndicadorDePassosProps) {
  return (
    <ol className="mb-5 flex flex-wrap items-center gap-2" aria-label="Etapas do cadastro">
      {passos.map((titulo, indice) => {
        const concluido = indice < passoAtual;
        const atual = indice === passoAtual;

        return (
          <li key={titulo} aria-current={atual ? "step" : undefined} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm font-semibold",
                concluido && "border-status-success-fg bg-status-success-fg text-white",
                atual && "border-primary bg-primary text-white",
                !concluido && !atual && "border-border-muted text-muted-foreground",
              )}
            >
              {concluido ? <Check className="h-4 w-4" aria-hidden="true" /> : indice + 1}
            </span>
            <span className={cn("text-sm font-medium", atual ? "text-foreground" : "text-muted-foreground")}>
              {titulo}
            </span>
            {indice < passos.length - 1 && <span aria-hidden="true" className="mx-1 h-0.5 w-8 bg-border-subtle" />}
          </li>
        );
      })}
    </ol>
  );
}
