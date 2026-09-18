import type { Urgency } from "./domain/urgency.entity";

/**
 * DTO de saída: o formato exato que a API devolve para o cliente. É o use
 * case quem monta esse DTO a partir da entidade de domínio — o controller
 * e as camadas HTTP só enxergam este formato serializável, nunca a entidade.
 */
export interface UrgencyDTO {
  id: string;
  titulo: string;
  descricao: string | null;
  metaArrecadacao: number | null;
  valorArrecadado: number;
  isActive: boolean;
  createdAt: string;
}

export function toUrgencyDTO(urgency: Urgency): UrgencyDTO {
  return {
    id: urgency.id,
    titulo: urgency.titulo,
    descricao: urgency.descricao,
    metaArrecadacao: urgency.metaArrecadacao,
    valorArrecadado: urgency.valorArrecadado,
    isActive: urgency.isActive,
    createdAt: urgency.createdAt,
  };
}
