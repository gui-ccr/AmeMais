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
 * Para cada status atual, o único status para onde ele pode ir — espelha a matriz
 * `MATRIZ_TRANSICAO` de apps/api/.../domain/shelter-status.vo.ts (fluxo em ciclo:
 * disponível → ocupado → em avaliação → inativo → disponível). Se o back mudar a regra,
 * a API continua recusando e a tela mostra a mensagem dela.
 */
export const TRANSICOES_STATUS_LAR: Record<StatusLar, readonly StatusLar[]> = {
  disponivel: ["ocupado"],
  ocupado: ["em_avaliacao"],
  em_avaliacao: ["inativo"],
  inativo: ["disponivel"],
};
