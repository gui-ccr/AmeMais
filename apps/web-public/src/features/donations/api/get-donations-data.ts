import { publicCollectionPointListSchema, publicUrgencyListSchema } from "@amemais/shared-types";
import { apiGet } from "@/lib/api";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CollectionPoint, Urgency } from "../types";
import { mapCollectionPoint } from "./map-collection-point";
import { mapUrgency } from "./map-urgency";

/**
 * Urgências ativas, já na ordem que a API manda (por prioridade).
 * Lança `ApiError` se a API falhar: a página decide o que mostrar.
 */
export async function getUrgencies(): Promise<Urgency[]> {
  const urgencias = await apiGet("/api/public/urgencias", publicUrgencyListSchema, { tags: [CACHE_TAGS.urgencias] });
  return urgencias.map(mapUrgency);
}

/** Pontos de coleta ativos. Lança `ApiError` se a API falhar. */
export async function getCollectionPoints(): Promise<CollectionPoint[]> {
  const pontos = await apiGet("/api/public/pontos-coleta", publicCollectionPointListSchema, {
    tags: [CACHE_TAGS.pontosColeta],
  });
  return pontos.map(mapCollectionPoint);
}
