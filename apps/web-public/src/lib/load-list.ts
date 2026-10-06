export interface ListResult<T> {
  items: T[];
  /** true quando a busca falhou: a página mostra um aviso em vez de uma lista vazia enganosa. */
  unavailable: boolean;
}

/**
 * Roda uma busca de lista e NUNCA lança: falha vira `unavailable: true` e é
 * logada no servidor (sem detalhe para o visitante). Usar nas páginas, para que
 * uma API fora do ar não derrube o site. Ver ADR 0009.
 */
export async function loadList<T>(label: string, fetcher: () => Promise<T[]>): Promise<ListResult<T>> {
  try {
    return { items: await fetcher(), unavailable: false };
  } catch (error) {
    console.error(`[web-public] não foi possível carregar: ${label}`, error);
    return { items: [], unavailable: true };
  }
}
