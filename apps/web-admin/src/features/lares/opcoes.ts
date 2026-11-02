import type { StatusLar } from "./types";

export const STATUS_LAR_INFO: Record<
  StatusLar,
  { rotulo: string; variante: "success" | "urgent" | "warning" | "muted" }
> = {
  disponivel: { rotulo: "Disponível", variante: "success" },
  ocupado: { rotulo: "Ocupado", variante: "urgent" },
  em_avaliacao: { rotulo: "Em avaliação", variante: "warning" },
  inativo: { rotulo: "Inativo", variante: "muted" },
};

/**
 * Para cada status atual, os status para onde ele pode ir — espelha a `MATRIZ_TRANSICAO` de
 * apps/api/src/features/lares/domain/shelter-status.vo.ts. É o ÚNICO lugar do front com essa
 * regra: o seletor de status lê daqui. Se o back mudar a regra, a API continua recusando e a
 * tela mostra a mensagem dela. Inativar um lar com animais é recusado pela API (422).
 */
export const TRANSICOES_STATUS_LAR: Record<StatusLar, readonly StatusLar[]> = {
  disponivel: ["ocupado", "em_avaliacao", "inativo"],
  ocupado: ["disponivel", "em_avaliacao", "inativo"],
  em_avaliacao: ["disponivel", "ocupado", "inativo"],
  inativo: ["em_avaliacao"],
};

/** Destinos possíveis a partir do status atual. */
export function transicoesPermitidas(status: StatusLar): readonly StatusLar[] {
  return TRANSICOES_STATUS_LAR[status];
}
