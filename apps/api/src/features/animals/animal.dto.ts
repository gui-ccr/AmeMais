import type { Animal } from "./domain/animal.entity";
import type { AnimalStatusValue } from "./domain/animal-status.vo";

/** DTO de saída: o formato exato que a API devolve pro cliente. */
export interface AdotanteDTO {
  nome: string;
  idade: number;
  /** Só os 8 dígitos. */
  cep: string;
  localidade: string;
}

export interface AnimalDTO {
  id: string;
  nome: string;
  especie: string | null;
  raca: string | null;
  status: AnimalStatusValue;
  urlFoto: string | null;
  larTemporarioId: string | null;
  adotanteId: string | null;
  /** Dados de quem adotou (pessoais): só existem para animais `adotado`. */
  adotante: AdotanteDTO | null;
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
    adotante: animal.adotante
      ? {
          nome: animal.adotante.nome,
          idade: animal.adotante.idade,
          cep: animal.adotante.cep,
          localidade: animal.adotante.localidade,
        }
      : null,
    dataAdocao: animal.dataAdocao,
    createdAt: animal.createdAt,
  };
}
