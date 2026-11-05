import type { Animal, Especie, StatusAnimal } from "./types";

/** Valor do Select para "não filtrar" (o Radix Select não aceita valor vazio). */
export const TODOS = "todos";

export interface FiltrosAnimais {
  busca: string;
  status: StatusAnimal | typeof TODOS;
  especie: Especie | typeof TODOS;
}

export const FILTROS_VAZIOS: FiltrosAnimais = { busca: "", status: TODOS, especie: TODOS };

export function temFiltroAtivo(filtros: FiltrosAnimais): boolean {
  return filtros.busca.trim() !== "" || filtros.status !== TODOS || filtros.especie !== TODOS;
}

/** Minúsculas e sem acento, para "tunico" achar "Túnico". */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Filtra a lista já carregada (a API de animais não tem query params, então nada recarrega).
 * A busca olha nome e raça.
 */
export function filtrarAnimais(animais: Animal[], filtros: FiltrosAnimais): Animal[] {
  const termo = normalizar(filtros.busca.trim());

  return animais.filter((animal) => {
    if (filtros.status !== TODOS && animal.status !== filtros.status) return false;
    if (filtros.especie !== TODOS && animal.especie !== filtros.especie) return false;
    if (!termo) return true;
    return normalizar(animal.nome).includes(termo) || normalizar(animal.raca).includes(termo);
  });
}
