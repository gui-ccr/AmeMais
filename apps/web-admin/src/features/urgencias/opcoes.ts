import type { PrioridadeUrgencia, TipoDoacao, UnidadeMeta } from "./types";

export const PRIORIDADE_INFO: Record<
  PrioridadeUrgencia,
  { rotulo: string; descricao: string; variante: "urgent" | "warning" | "neutral"; ordem: number }
> = {
  urgente: {
    rotulo: "Urgente",
    descricao: "Precisamos com pressa — vai para o topo do mural.",
    variante: "urgent",
    ordem: 0,
  },
  importante: {
    rotulo: "Importante",
    descricao: "Faz falta, mas dá para esperar um pouco.",
    variante: "warning",
    ordem: 1,
  },
  continua: {
    rotulo: "Contínua",
    descricao: "Precisamos sempre, sem prazo fechado.",
    variante: "neutral",
    ordem: 2,
  },
};

/** `unidadeSugerida` só pré-preenche a unidade ao cadastrar; a pessoa pode trocar. */
export const TIPO_INFO: Record<TipoDoacao, { rotulo: string; unidadeSugerida: UnidadeMeta }> = {
  racao: { rotulo: "Ração", unidadeSugerida: "kg" },
  medicamento: { rotulo: "Medicamentos", unidadeSugerida: "un" },
  consulta: { rotulo: "Consulta veterinária", unidadeSugerida: "R$" },
  cirurgia: { rotulo: "Cirurgia", unidadeSugerida: "R$" },
  higiene: { rotulo: "Higiene e limpeza", unidadeSugerida: "un" },
  cobertores: { rotulo: "Cobertores e abrigo", unidadeSugerida: "un" },
  outros: { rotulo: "Outros", unidadeSugerida: "un" },
};

export const UNIDADE_INFO: Record<UnidadeMeta, { rotulo: string }> = {
  kg: { rotulo: "kg" },
  un: { rotulo: "unidades" },
  L: { rotulo: "litros" },
  "R$": { rotulo: "R$" },
};

export function formatarQuantidade(valor: number, unidade: UnidadeMeta): string {
  if (unidade === "R$") {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ${unidade}`;
}
