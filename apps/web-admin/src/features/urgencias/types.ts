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

/**
 * Modelo de urgência do front. Hoje é alimentado por um mock (ver
 * `urgencia-service.ts`). O DTO real da API só tem titulo, descricao,
 * metaArrecadacao, valorArrecadado e isActive — `prioridade`, `tipo`,
 * `dataLimite` e `unidade` ainda não existem lá (precisam de colunas novas no
 * back). `meta` e `arrecadado` correspondem a metaArrecadacao/valorArrecadado.
 */
export interface Urgencia {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: PrioridadeUrgencia;
  tipo: TipoDoacao;
  /** Dia limite no formato AAAA-MM-DD, ou null quando não há prazo. */
  dataLimite: string | null;
  /** Quantidade necessária (na `unidade`), ou null quando não há meta. */
  meta: number | null;
  unidade: UnidadeMeta;
  /** Quanto já foi arrecadado, na mesma `unidade` da meta. */
  arrecadado: number;
  /** Se a urgência aparece para o público no site. */
  ativo: boolean;
  createdAt: string;
}

export type UrgenciaFormValues = Omit<Urgencia, "id" | "createdAt">;
