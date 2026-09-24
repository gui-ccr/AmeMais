export const ESPECIES = ["cachorro", "gato", "outro"] as const;
export type Especie = (typeof ESPECIES)[number];

export interface Adotante {
  nome: string;
  idade: number;
  /** CEP formatado (00000-000). */
  cep: string;
  /** Cidade/UF, ex.: "Teófilo Otoni - MG". */
  localidade: string;
}

/**
 * Modelo de animal do front. Hoje é alimentado por um mock (ver
 * `animal-service.ts`). O DTO real da API (`AnimalDTO`) só tem nome, especie,
 * raca, status, urlFoto, larTemporarioId, adotanteId, dataAdocao e createdAt:
 * não existe onde guardar nome/idade/localidade/CEP do adotante e não há
 * endpoint de upload de foto (a API só recebe `urlFoto` como URL).
 */
export interface Animal {
  id: string;
  nome: string;
  especie: Especie;
  raca: string;
  /** URL (ou data URL, no mock) da foto; null se o animal não tiver foto. */
  urlFoto: string | null;
  adotante: Adotante;
  /** Dia da adoção no formato AAAA-MM-DD. */
  dataAdocao: string;
  createdAt: string;
}

export interface NovoAnimalInput {
  nome: string;
  especie: Especie;
  raca: string;
  foto: File;
  adotante: Adotante;
  dataAdocao: string;
}
