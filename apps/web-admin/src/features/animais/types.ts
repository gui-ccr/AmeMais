/** Mesma lista de apps/api/src/features/animals/domain/animal-options.ts (e do CHECK no banco). */
export const ESPECIES = ["Cachorro", "Gato", "Outro"] as const;
export type Especie = (typeof ESPECIES)[number];

/** Mesmas listas e limites de apps/api/.../animals/domain/animal-options.ts (e dos CHECKs do banco). */
export const PORTES = ["P", "M", "G"] as const;
export type Porte = (typeof PORTES)[number];
export const FAIXAS_ETARIAS = ["filhote", "adulto", "idoso"] as const;
export type FaixaEtaria = (typeof FAIXAS_ETARIAS)[number];
export const IDADE_TEXTO_MAX = 40;
export const DESCRICAO_MAX = 500;

/** Mesma lista de apps/api/src/features/animals/domain/animal-status.vo.ts. */
export const STATUS_ANIMAL = ["disponivel", "em_tratamento", "em_lar_temporario", "adotado"] as const;
export type StatusAnimal = (typeof STATUS_ANIMAL)[number];

export interface Adotante {
  nome: string;
  idade: number;
  /** CEP formatado (00000-000). A API guarda só os 8 dígitos. */
  cep: string;
  /** Cidade/UF, ex.: "Teófilo Otoni - MG". */
  localidade: string;
}

/**
 * Formato que a API devolve em `/api/animals` — espelha
 * apps/api/src/features/animals/animal.dto.ts. Só o `animal-service.ts` conhece
 * esse formato: as telas usam o modelo `Animal` abaixo.
 */
export interface AnimalDTO {
  id: string;
  nome: string;
  especie: string | null;
  raca: string | null;
  status: StatusAnimal;
  porte: Porte;
  faixaEtaria: FaixaEtaria;
  idadeTexto: string | null;
  descricao: string | null;
  urlFoto: string | null;
  larTemporarioId: string | null;
  adotanteId: string | null;
  adotante: { nome: string; idade: number; cep: string; localidade: string } | null;
  dataAdocao: string | null;
  createdAt: string;
}

/** Modelo de animal usado pelas telas (a tradução do DTO é feita em `animal-service.ts`). */
export interface Animal {
  id: string;
  nome: string;
  especie: Especie;
  raca: string;
  status: StatusAnimal;
  /** Porte e faixa etária aparecem no site público (/adote). */
  porte: Porte;
  faixaEtaria: FaixaEtaria;
  /** Idade em texto livre (ex.: "2 anos"); vazio quando não informada. */
  idadeTexto: string;
  /** Texto do cartão no site público; vazio quando não informado. */
  descricao: string;
  /** URL pública da foto; null se o animal não tiver foto. */
  urlFoto: string | null;
  /** Quem adotou. Só existe para animais `adotado` (dado pessoal: nunca vai para o site público). */
  adotante: Adotante | null;
  /** Dia da adoção no formato AAAA-MM-DD. */
  dataAdocao: string | null;
  createdAt: string;
}

/**
 * Status com que a API aceita cadastrar um animal — espelha
 * `Animal.STATUSES_PERMITIDOS_NA_CRIACAO` em apps/api/.../domain/animal.entity.ts.
 * `em_lar_temporario` fica de fora: o animal só vai para um lar temporário depois,
 * pela troca de status.
 */
export const STATUS_NO_CADASTRO = ["disponivel", "em_tratamento", "adotado"] as const;
export type StatusNoCadastro = (typeof STATUS_NO_CADASTRO)[number];

/** Dados da adoção: a API exige os dois sempre que o animal é cadastrado ou passa a `adotado`. */
export interface Adocao {
  adotante: Adotante;
  /** Dia da adoção no formato AAAA-MM-DD. */
  dataAdocao: string;
}

/** O que o formulário de cadastro envia: o animal resgatado, com a foto ainda como arquivo. */
export interface NovoAnimalInput {
  nome: string;
  especie: Especie;
  raca: string;
  porte: Porte;
  faixaEtaria: FaixaEtaria;
  idadeTexto: string;
  descricao: string;
  foto: File;
  status: StatusNoCadastro;
  /** Obrigatório quando `status` é `adotado`; nos demais status não pode ser enviado. */
  adocao?: Adocao;
}

/** O que a troca de status envia. `adocao` só existe (e é obrigatória) quando o novo status é `adotado`. */
export interface AlterarStatusInput {
  status: StatusAnimal;
  adocao?: Adocao;
}

/** O que a edição envia (`PUT /api/animals/:id`): os dados do animal, sem foto, status nem adoção. */
export interface EditarAnimalInput {
  nome: string;
  especie: Especie;
  raca: string;
  porte: Porte;
  faixaEtaria: FaixaEtaria;
  idadeTexto: string;
  descricao: string;
}
