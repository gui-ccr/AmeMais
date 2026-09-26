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
 * Formato que a API devolve em `/api/urgencias` — espelha
 * apps/api/src/features/urgencies/urgency.dto.ts. Só o `urgencia-service.ts`
 * conhece esse formato: as telas usam o modelo `Urgencia` abaixo.
 */
export interface UrgencyDTO {
  id: string;
  titulo: string;
  descricao: string | null;
  metaArrecadacao: number | null;
  valorArrecadado: number;
  unidade: UnidadeMeta;
  prioridade: PrioridadeUrgencia;
  tipo: TipoDoacao;
  dataLimite: string | null;
  isActive: boolean;
  createdAt: string;
}

/**
 * Modelo de urgência usado pelas telas. `meta` e `arrecadado` correspondem a
 * `metaArrecadacao`/`valorArrecadado` da API e `ativo` a `isActive` (a tradução
 * é feita em `urgencia-service.ts`).
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
