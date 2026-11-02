import type { Lar, StatusLar } from "./types";

/** Valor do Select para "não filtrar" (o Radix Select não aceita valor vazio). */
export const TODOS = "todos";

export interface FiltrosLares {
  busca: string;
  status: StatusLar | typeof TODOS;
  /** Atalho "só com vagas": esconde lares cheios e inativos. */
  somenteComVagas: boolean;
}

export const FILTROS_VAZIOS: FiltrosLares = { busca: "", status: TODOS, somenteComVagas: false };

export function temFiltroAtivo(filtros: FiltrosLares): boolean {
  return filtros.busca.trim() !== "" || filtros.status !== TODOS || filtros.somenteComVagas;
}

/** Minúsculas e sem acento, para "joao" achar "João". */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Filtra a lista já carregada (sem ir à API, então nada recarrega). A busca olha responsável
 * e endereço/região — os mesmos campos da busca do back. "Só com vagas" mostra lares com vaga
 * livre e que não estão inativos (um lar inativo não recebe animais).
 */
export function filtrarLares<T extends Lar>(lares: T[], filtros: FiltrosLares): T[] {
  const termo = normalizar(filtros.busca.trim());

  return lares.filter((lar) => {
    if (filtros.status !== TODOS && lar.status !== filtros.status) return false;
    if (filtros.somenteComVagas && (lar.vagas <= 0 || lar.status === "inativo")) return false;
    if (!termo) return true;
    return normalizar(lar.nomeResponsavel).includes(termo) || normalizar(lar.enderecoRegiao).includes(termo);
  });
}
