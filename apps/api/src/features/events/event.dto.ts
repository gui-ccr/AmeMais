import type { Event } from "./domain/event.entity";

/**
 * DTO de saída: o formato exato que a API devolve pro cliente. É o use
 * case quem monta esse DTO a partir da entidade de domínio — o controller
 * e as camadas HTTP só enxergam este formato, nunca a entidade. `dataEvento`
 * aqui é a string crua, não o Value Object — um DTO nunca vaza instâncias
 * de domínio, só valores serializáveis.
 */
export interface EventDTO {
  id: string;
  titulo: string;
  descricao: string | null;
  dataEvento: string | null;
  isActive: boolean;
  createdAt: string;
}

export function toEventDTO(event: Event): EventDTO {
  return {
    id: event.id,
    titulo: event.titulo,
    descricao: event.descricao,
    dataEvento: event.dataEvento?.valor ?? null,
    isActive: event.isActive,
    createdAt: event.createdAt,
  };
}
