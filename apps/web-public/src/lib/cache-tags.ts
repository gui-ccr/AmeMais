/**
 * Etiquetas de cache (tags do Next) de cada tipo de dado do site.
 *
 * Cada busca em `apiGet` leva a tag do seu dado. Quando algo muda no painel, a
 * API chama `POST /api/revalidate` com a tag e o Next descarta só aquele cache,
 * em vez de esperar o prazo do `revalidate`. Ver ADR 0009.
 */
export const CACHE_TAGS = {
  animais: "animais",
  urgencias: "urgencias",
  pontosColeta: "pontos-coleta",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

export const ALL_CACHE_TAGS: readonly CacheTag[] = Object.values(CACHE_TAGS);
