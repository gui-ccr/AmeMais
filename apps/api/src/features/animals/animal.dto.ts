import type { Animal } from "./domain/animal.entity";
import type { AnimalStatusValue } from "./domain/animal-status.vo";

/**
 * DTO de saída: o formato exato que a API devolve pro cliente. É o use
 * case quem monta esse DTO a partir da entidade de domínio — o controller
 * e as camadas HTTP só enxergam este formato, nunca a entidade. `status`
 * aqui é a string crua, não o Value Object — um DTO nunca vaza instâncias
 * de domínio, só valores serializáveis.
 */
export interface AnimalDTO {
  id: string;
  nome: string;
  especie: string | null;
  raca: string | null;
  status: AnimalStatusValue;
  urlFoto: string | null;
  larTemporarioId: string | null;
  adotanteId: string | null;
  dataAdocao: string | null;
  createdAt: string;
}

export function toAnimalDTO(animal: Animal): AnimalDTO {
  return {
    id: animal.id,
    nome: animal.nome,
    especie: animal.especie,
    raca: animal.raca,
    status: animal.status.valor,
    urlFoto: animal.urlFoto,
    larTemporarioId: animal.larTemporarioId,
    adotanteId: animal.adotanteId,
    dataAdocao: animal.dataAdocao,
    createdAt: animal.createdAt,
  };
}
