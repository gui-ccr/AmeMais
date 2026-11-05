/** Mesma lista de apps/api/src/features/animals/domain/animal-options.ts (e do CHECK no banco). */
export const ESPECIES = ["Cachorro", "Gato", "Outro"] as const;
export type Especie = (typeof ESPECIES)[number];

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
  urlFoto: string | null;
  larTemporarioId: string | null;
  /** Lar onde o animal está (só vem na lista e no detalhe). */
  lar: { id: string; nomeResponsavel: string } | null;
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
  /** URL pública da foto; null se o animal não tiver foto. */
  urlFoto: string | null;
  /** Lar temporário onde o animal está; null se não estiver em nenhum. */
  lar: { id: string; nomeResponsavel: string } | null;
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
  foto: File;
  status: StatusNoCadastro;
  /** Obrigatório quando `status` é `adotado`; nos demais status não pode ser enviado. */
  adocao?: Adocao;
}

/** O que a troca de status envia. `adocao` só existe (e é obrigatória) quando o novo status é `adotado`. */
export interface AlterarStatusInput {
  status: StatusAnimal;
  /**
   * Obrigatório para `em_lar_temporario`: a API só aceita esse status com o animal vinculado a um lar
   * (o vínculo grava o lar e o status juntos, por `POST /api/lares/:id/animais`).
   */
  larId?: string;
  adocao?: Adocao;
}
