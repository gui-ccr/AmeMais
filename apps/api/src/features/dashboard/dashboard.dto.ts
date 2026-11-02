import type { AnimalStatusValue } from "../animals/domain/animal-status.vo";

/** Cada bloco é `null` quando a pessoa não tem acesso ao módulo dele. */
export interface DashboardDTO {
  animais: { total: number; porStatus: Record<AnimalStatusValue, number> } | null;
  lares: { disponiveis: number; vagasLivres: number } | null;
  urgencias: { abertas: number; urgentes: number } | null;
  voluntarios: { ativos: number; total: number } | null;
  eventos: { total: number; proximos: EventoProximoDTO[] } | null;
}

export interface EventoProximoDTO {
  id: string;
  titulo: string;
  dataEvento: string;
}
