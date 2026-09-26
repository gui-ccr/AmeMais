import type { Urgency } from "./domain/urgency.entity";
import type { PrioridadeUrgencia, TipoDoacao, UnidadeMeta } from "./domain/urgency-options";

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
  unidade: UnidadeMeta;
  prioridade: PrioridadeUrgencia;
  tipo: TipoDoacao;
  dataLimite: string | null;
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
    unidade: urgency.unidade,
    prioridade: urgency.prioridade,
    tipo: urgency.tipo,
    dataLimite: urgency.dataLimite,
    isActive: urgency.isActive,
    createdAt: urgency.createdAt,
  };
}
