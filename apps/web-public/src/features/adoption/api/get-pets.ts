import { publicAnimalListSchema } from "@amemais/shared-types";
import { apiGet } from "@/lib/api";
import { CACHE_TAGS } from "@/lib/cache-tags";
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
