import type { StatusAnimal } from "@/features/animais/types";

/** Resposta de `GET /api/dashboard`. Cada bloco é `null` quando a pessoa não acessa o módulo dele. */
export interface Dashboard {
  animais: { total: number; porStatus: Record<StatusAnimal, number> } | null;
  lares: { disponiveis: number; vagasLivres: number } | null;
  urgencias: { abertas: number; urgentes: number } | null;
  voluntarios: { ativos: number; total: number } | null;
  eventos: { total: number; proximos: EventoProximo[] } | null;
}

export interface EventoProximo {
  id: string;
  titulo: string;
  dataEvento: string;
}
