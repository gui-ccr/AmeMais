import type { AreaDeAjuda, StatusVoluntario, TipoVoluntario, Voluntario } from "./types";

/** Valor dos Selects para "não filtrar" (o Radix Select não aceita valor vazio). */
export const TODOS = "todos";

export interface FiltrosVoluntarios {
  busca: string;
  tipo: TipoVoluntario | typeof TODOS;
  status: StatusVoluntario | typeof TODOS;
  area: AreaDeAjuda | typeof TODOS;
}

export const FILTROS_VAZIOS: FiltrosVoluntarios = { busca: "", tipo: TODOS, status: TODOS, area: TODOS };

export function temFiltroAtivo(filtros: FiltrosVoluntarios): boolean {
  return (
    filtros.busca.trim() !== "" || filtros.tipo !== TODOS || filtros.status !== TODOS || filtros.area !== TODOS
  );
}

/** Minúsculas e sem acento, para "joao" achar "João". */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Só números e sinais de telefone ("(33) 9 9999", "3399…"): aí a busca compara os dígitos do telefone (igual ao back). */
const PARECE_TELEFONE = /^[\d\s()+.-]+$/;

/**
 * Filtra a lista já carregada (sem ir à API, então nada recarrega). A busca olha nome,
 * e-mail e telefone — os mesmos campos da busca do back (`construirFiltroBusca`) — e os
 * filtros de tipo/status/área funcionam como os parâmetros `tipo`, `status` e `area` da API.
 */
export function filtrarVoluntarios<T extends Voluntario>(voluntarios: T[], filtros: FiltrosVoluntarios): T[] {
  const termo = filtros.busca.trim();
  const termoNormalizado = normalizar(termo);
  const digitosDoTermo = PARECE_TELEFONE.test(termo) ? termo.replace(/\D/g, "") : "";

  return voluntarios.filter((voluntario) => {
    if (filtros.tipo !== TODOS && voluntario.tipo !== filtros.tipo) return false;
    if (filtros.status !== TODOS && voluntario.status !== filtros.status) return false;
    if (filtros.area !== TODOS && !voluntario.areasDeAjuda.includes(filtros.area)) return false;
    if (!termo) return true;

    return (
      normalizar(voluntario.nome).includes(termoNormalizado) ||
      normalizar(voluntario.email).includes(termoNormalizado) ||
      (digitosDoTermo !== "" && voluntario.telefone.replace(/\D/g, "").includes(digitosDoTermo))
    );
  });
}
