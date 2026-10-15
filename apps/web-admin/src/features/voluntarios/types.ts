/** Perfis do voluntário: os mesmos valores do `CHECK` de `voluntarios.tipo` e de `TIPOS_VOLUNTARIO` do back. */
export const TIPOS_VOLUNTARIO = ["veterinario", "apoio_geral"] as const;
export type TipoVoluntario = (typeof TIPOS_VOLUNTARIO)[number];

/** O voluntário nasce `ativo`; o status só muda por uma operação própria, não pelo cadastro/edição. */
export const STATUS_VOLUNTARIO = ["ativo", "inativo"] as const;
export type StatusVoluntario = (typeof STATUS_VOLUNTARIO)[number];

/** As mesmas opções de "Como quer ajudar" do formulário "Quero ser voluntário" do portal público. */
export const AREAS_DE_AJUDA = ["lar_temporario", "transporte", "eventos", "divulgacao"] as const;
export type AreaDeAjuda = (typeof AREAS_DE_AJUDA)[number];

/**
 * Formato que a API devolve em `/api/voluntarios` — espelha
 * apps/api/src/features/voluntarios/voluntario.dto.ts. Só o `voluntario-service.ts`
 * conhece esse formato: as telas usam `Voluntario`.
 */
export interface VoluntarioDTO {
  id: string;
  nome: string;
  email: string | null;
  /** Só dígitos (10 ou 11, com DDD), sem máscara. Ex.: "33998765432". Vem `""` em registro antigo sem telefone. */
  telefone: string;
  tipo: TipoVoluntario;
  status: StatusVoluntario;
  bairro: string | null;
  areasDeAjuda: AreaDeAjuda[];
  createdAt: string;
}

/** Voluntário da ONG. Modelo usado pelas telas. */
export interface Voluntario {
  id: string;
  nome: string;
  /** Vazio se não foi informado. */
  email: string;
  /** WhatsApp/telefone já com máscara para exibir, ex.: "(33) 99999-1234". É o principal meio de contato. */
  telefone: string;
  tipo: TipoVoluntario;
  status: StatusVoluntario;
  /** Vazio se não foi informado. */
  bairro: string;
  /** Como a pessoa quer ajudar; pode estar vazia. */
  areasDeAjuda: AreaDeAjuda[];
  createdAt: string;
}

/**
 * O que o cadastro envia. Campos opcionais vão como `null` (nunca string vazia). Não
 * tem `status`: o voluntário nasce `ativo`.
 */
export interface NovoVoluntarioInput {
  nome: string;
  email: string | null;
  /** Só dígitos, sem máscara. */
  telefone: string;
  tipo: TipoVoluntario;
  bairro: string | null;
  areasDeAjuda: AreaDeAjuda[];
}

/** A edição envia os mesmos campos do cadastro (também sem `status`). */
export type EditarVoluntarioInput = NovoVoluntarioInput;
