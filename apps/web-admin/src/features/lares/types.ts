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
  aceitaGatos: boolean;
  aceitaCachorros: boolean;
  observacoes: string | null;
  voluntarioId: string | null;
  isActive: boolean;
  createdAt: string;
  /** Quantos animais moram no lar e quantas vagas sobram (vêm na lista e no detalhe). */
  ocupacao: number;
  vagas: number;
}

/** Animal que mora no lar, como o `GET /api/lares/:id` devolve. */
export interface AnimalNoLarDTO {
  id: string;
  nome: string;
  especie: string | null;
  urlFoto: string | null;
}

/** `GET /api/lares/:id` (e as rotas de vincular/desvincular animal): o lar com os animais e o voluntário responsável. */
export interface ShelterDetailDTO extends ShelterDTO {
  animais: AnimalNoLarDTO[];
  voluntario: { id: string; nome: string } | null;
}

/** Lar temporário: a casa de um voluntário que abriga animais até a adoção. Modelo usado pelas telas. */
export interface Lar {
  id: string;
  nomeResponsavel: string;
  /** Como falar com o responsável (a API só exige que não esteja vazio). */
  contato: string;
  /** Quantos animais o lar comporta. */
  capacidade: number;
  /** Quantos animais moram no lar agora. */
  ocupacao: number;
  /** Vagas livres (capacidade - ocupação). */
  vagas: number;
  /** A situação do lar. É a fonte da verdade: use este campo, e não `ativo`, para saber se o lar está em uso. */
  status: StatusLar;
  /** Endereço ou região do lar. Vazio se a API não trouxe. */
  enderecoRegiao: string;
  aceitaGatos: boolean;
  aceitaCachorros: boolean;
  /** Vazio se não foi informado. */
  observacoes: string;
  /** Voluntário responsável, quando o lar foi ligado a um cadastro de voluntário. */
  voluntarioId: string | null;
  /** `isActive` da API; use `status` para saber se o lar está em uso. */
  ativo: boolean;
  createdAt: string;
}

export interface AnimalNoLar {
  id: string;
  nome: string;
  /** Vazio se não informada. */
  especie: string;
  urlFoto: string | null;
}

/** O lar com os animais que moram nele e o nome do voluntário responsável (só o detalhe traz isso). */
export interface LarDetalhe extends Lar {
  animais: AnimalNoLar[];
  voluntario: { id: string; nome: string } | null;
}

/** Animal que pode ser vinculado a um lar (sem lar e não adotado). */
export interface AnimalElegivel {
  id: string;
  nome: string;
  especie: string;
  urlFoto: string | null;
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
  aceitaGatos: boolean;
  aceitaCachorros: boolean;
  /** `null` quando em branco. */
  observacoes: string | null;
  /** `null` = sem voluntário ligado (na edição, desliga o que estava ligado). */
  voluntarioId: string | null;
}

/**
 * O que a edição envia: os mesmos campos do cadastro (`PUT /api/lares/:id` aceita edição
 * parcial, mas o formulário sempre manda tudo). O status não entra aqui — ele só muda por
 * `updateStatus`, que respeita a matriz de transições.
 */
export type EditarLarInput = NovoLarInput;
