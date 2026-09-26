/**
 * Valores fixos que uma urgência aceita. Ficam num arquivo só para o schema
 * Zod (borda HTTP) e a entidade (domínio) usarem exatamente a mesma lista — e
 * a lista bate com os CHECKs da migration
 * `20260925210000_urgencias_prioridade_tipo_unidade_prazo.sql`.
 */
export const PRIORIDADES_URGENCIA = ["urgente", "importante", "continua"] as const;
export type PrioridadeUrgencia = (typeof PRIORIDADES_URGENCIA)[number];

export const TIPOS_DOACAO = [
  "racao",
  "medicamento",
  "consulta",
  "cirurgia",
  "higiene",
  "cobertores",
  "outros",
] as const;
export type TipoDoacao = (typeof TIPOS_DOACAO)[number];

export const UNIDADES_META = ["kg", "un", "L", "R$"] as const;
export type UnidadeMeta = (typeof UNIDADES_META)[number];

export const PRIORIDADE_PADRAO: PrioridadeUrgencia = "importante";
export const TIPO_PADRAO: TipoDoacao = "outros";
export const UNIDADE_PADRAO: UnidadeMeta = "R$";
