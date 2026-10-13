/** Mesma lista de apps/api/src/features/lares/domain/shelter-status.vo.ts. */
export const STATUS_LAR = ["disponivel", "ocupado", "em_avaliacao", "inativo"] as const;
export type StatusLar = (typeof STATUS_LAR)[number];

/**
 * Formato que a API devolve em `/api/lares` — espelha
 * apps/api/src/features/lares/shelter.dto.ts. Só o `lar-service.ts` conhece esse
 * formato: as telas usam o modelo `Lar` abaixo.
 */
export interface ShelterDTO {
  id: string;
  nomeResponsavel: string;
  contato: string;
  capacidade: number;
  status: StatusLar;
  enderecoRegiao: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Lar temporário: a casa de um voluntário que abriga animais até a adoção. Modelo usado pelas telas. */
export interface Lar {
  id: string;
  nomeResponsavel: string;
  /** Como falar com o responsável (a API só exige que não esteja vazio). */
  contato: string;
  /** Quantos animais o lar comporta. */
  capacidade: number;
  /** A situação do lar. É a fonte da verdade: use este campo, e não `ativo`, para saber se o lar está em uso. */
  status: StatusLar;
  /** Endereço ou região do lar. Vazio se a API não trouxe. */
  enderecoRegiao: string;
  /**
   * `isActive` da API. Não confie nele: a API marca `false` ao inativar, mas o
   * repositório hoje só grava o `status`, então este campo quase sempre vem `true`.
   */
  ativo: boolean;
  createdAt: string;
}

/**
 * O que o cadastro envia. Não tem `status`: a API só aceita criar um lar como
 * "disponível" (ver `Shelter.STATUSES_PERMITIDOS_NA_CRIACAO`) e já assume isso sozinha.
 */
export interface NovoLarInput {
  nomeResponsavel: string;
  contato: string;
  capacidade: number;
  enderecoRegiao: string;
}

/**
 * O que a edição envia: os mesmos quatro campos do cadastro. O status não entra
 * aqui — ele só muda por `updateStatus`, que respeita a ordem de transições.
 */
export type EditarLarInput = NovoLarInput;
