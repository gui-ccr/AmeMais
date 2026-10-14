import type { Shelter } from "./domain/shelter.entity";
import type { ShelterStatusValue } from "./domain/shelter-status.vo";
export type { CreateShelterDTO } from "./schema";

/**
 * DTO de saída: o formato exato que a API devolve pro cliente. É o use
 * case quem monta esse DTO a partir da entidade de domínio — o controller
 * e as camadas HTTP só enxergam este formato, nunca a entidade. `status`
 * aqui é a string crua, não o Value Object — um DTO nunca vaza instâncias
 * de domínio, só valores serializáveis.
 */
export interface ShelterDTO {
  id: string;
  nomeResponsavel: string;
  contato: string;
  capacidade: number;
  status: ShelterStatusValue;
  enderecoRegiao: string | null;
  isActive: boolean;
  createdAt: string;
}

export function toShelterDTO(shelter: Shelter): ShelterDTO {
  return {
    id: shelter.id,
    nomeResponsavel: shelter.nomeResponsavel,
    contato: shelter.contato,
    capacidade: shelter.capacidade,
    status: shelter.status.valor,
    enderecoRegiao: shelter.enderecoRegiao,
    isActive: shelter.isActive,
    createdAt: shelter.createdAt,
  };
}


export interface ShelterListItemDTO extends ShelterDTO {
  ocupacao: number;
  vagas: number;
}

export function toShelterListItemDTO(shelter: Shelter, ocupacao: number, vagas: number): ShelterListItemDTO {
  return { ...toShelterDTO(shelter), ocupacao, vagas };
}