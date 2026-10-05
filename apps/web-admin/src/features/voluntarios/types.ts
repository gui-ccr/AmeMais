/**
 * Perfis do voluntário. São os dois valores do `CHECK` da coluna `voluntarios.tipo`
 * no banco ('Veterinário' e 'Apoio Geral'), escritos no padrão das outras rotas da
 * API (sem acento e com `_`); quem traduz para o texto do banco é o back.
 */
export const TIPOS_VOLUNTARIO = ["veterinario", "apoio_geral"] as const;
export type TipoVoluntario = (typeof TIPOS_VOLUNTARIO)[number];

/** As mesmas opções de "Como quer ajudar" do formulário "Quero ser voluntário" do portal público. */
export const AREAS_DE_AJUDA = ["lar_temporario", "transporte", "eventos", "divulgacao"] as const;
export type AreaDeAjuda = (typeof AREAS_DE_AJUDA)[number];

/**
 * Formato PROPOSTO para `/api/voluntarios` (a rota ainda não existe — ver
 * `voluntario-service.ts`). Só o service conhece esse formato: as telas usam `Voluntario`.
 */
export interface VoluntarioDTO {
  id: string;
  nome: string;
  email: string | null;
  telefone: string;
  tipo: TipoVoluntario;
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
  /** WhatsApp/telefone com máscara, ex.: "(33) 99999-1234". É o principal meio de contato. */
  telefone: string;
  tipo: TipoVoluntario;
  /** Vazio se não foi informado. */
  bairro: string;
  /** Como a pessoa quer ajudar; pode estar vazia. */
  areasDeAjuda: AreaDeAjuda[];
  createdAt: string;
}

/** O que o cadastro envia. Campos opcionais vão como `null` (nunca string vazia). */
export interface NovoVoluntarioInput {
  nome: string;
  email: string | null;
  telefone: string;
  tipo: TipoVoluntario;
  bairro: string | null;
  areasDeAjuda: AreaDeAjuda[];
}

/** A edição envia os mesmos campos do cadastro. */
export type EditarVoluntarioInput = NovoVoluntarioInput;
