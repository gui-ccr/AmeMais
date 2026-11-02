import type { Shelter } from "./domain/shelter.entity";
import type { ShelterStatusValue } from "./domain/shelter-status.vo";
export type { CreateShelterDTO, UpdateShelterDTO } from "./schema";

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
  aceitaGatos: boolean;
  aceitaCachorros: boolean;
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
    aceitaGatos: shelter.aceitaGatos,
    aceitaCachorros: shelter.aceitaCachorros,
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

/** Animal que está morando no lar, como aparece nos detalhes (KAN-79). */
export interface AnimalNoLarDTO {
  id: string;
  nome: string;
  especie: string | null;
  urlFoto: string | null;
}

/** Resposta do GET /api/lares/:id (KAN-79). `animais` nunca é null. */
export interface ShelterDetailDTO extends ShelterListItemDTO {
  animais: AnimalNoLarDTO[];
}

export function toShelterDetailDTO(shelter: Shelter, animais: AnimalNoLarDTO[]): ShelterDetailDTO {
  const ocupacao = animais.length;
  return { ...toShelterListItemDTO(shelter, ocupacao, shelter.capacidade - ocupacao), animais };
}
