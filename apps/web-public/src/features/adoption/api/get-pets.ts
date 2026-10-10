import { publicAnimalListSchema } from "@amemais/shared-types";
import { apiGet } from "@/lib/api";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { loadList } from "@/lib/load-list";
import type { Pet } from "../types";
import { mapPet } from "./map-pet";

/**
 * Animais disponíveis para adoção. Lança `ApiError` se a API falhar: a página
 * decide o que mostrar.
 */
export async function getPets(): Promise<Pet[]> {
  const animais = await apiGet("/api/public/animais", publicAnimalListSchema, { tags: [CACHE_TAGS.animais] });
  return animais.map(mapPet);
}

export interface PetsResult {
  pets: Pet[];
  /** true quando a API falhou: a página mostra um aviso em vez de uma lista vazia enganosa. */
  unavailable: boolean;
}

/**
 * Como `getPets`, mas nunca lança: falha vira `unavailable: true` (e é logada no
 * servidor, sem detalhe para o visitante). Usar nas páginas.
 */
export async function loadPets(): Promise<PetsResult> {
  const { items, unavailable } = await loadList("animais", getPets);
  return { pets: items, unavailable };
}
