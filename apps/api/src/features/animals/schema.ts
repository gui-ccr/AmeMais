import { z } from "zod";
import { DESCRICAO_MAX, ESPECIES, FAIXAS_ETARIAS, IDADE_TEXTO_MAX, PORTES } from "./domain/animal-options";
import { ANIMAL_STATUSES } from "./domain/animal-status.vo";

/** Schemas Zod: validam o que chega pela requisição. */
/** Adotante: mesmas faixas do domínio, com erro campo a campo. CEP só com 8 números. */
const adotanteSchema = z.object({
  nome: z.string().min(2, "nome do adotante deve ter pelo menos 2 caracteres"),
  idade: z
    .number()
    .int("idade do adotante deve ser um número inteiro")
    .min(1, "idade do adotante deve ser no mínimo 1")
    .max(120, "idade do adotante deve ser no máximo 120"),
  cep: z.string().regex(/^\d{8}$/, "cep do adotante deve conter exatamente 8 números"),
  localidade: z.string().min(1, "localidade do adotante é obrigatória"),
});

const dataAdocaoSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dataAdocao deve estar no formato AAAA-MM-DD");

/** Campos que o site público mostra. Texto vazio vira "sem valor" (null) na entidade. */
const camposPublicosSchema = {
  porte: z.enum(PORTES, { message: `porte deve ser um de: ${PORTES.join(", ")}` }),
  faixaEtaria: z.enum(FAIXAS_ETARIAS, { message: `faixaEtaria deve ser uma de: ${FAIXAS_ETARIAS.join(", ")}` }),
  idadeTexto: z.string().max(IDADE_TEXTO_MAX, `idadeTexto deve ter no máximo ${IDADE_TEXTO_MAX} caracteres`),
  descricao: z.string().max(DESCRICAO_MAX, `descricao deve ter no máximo ${DESCRICAO_MAX} caracteres`),
};

export const createAnimalSchema = z.object({
  nome: z.string().min(2, "nome deve ter pelo menos 2 caracteres"),
  especie: z.enum(ESPECIES).optional(),
  raca: z.string().optional(),
  status: z.enum(ANIMAL_STATUSES).default("disponivel"),
  urlFoto: z.string().url().optional(),
  /** Sem porte/faixa, o animal nasce M/adulto (mesmo padrão do banco). */
  porte: camposPublicosSchema.porte.optional(),
  faixaEtaria: camposPublicosSchema.faixaEtaria.optional(),
  idadeTexto: camposPublicosSchema.idadeTexto.nullish(),
  descricao: camposPublicosSchema.descricao.nullish(),
  adotante: adotanteSchema.optional(),
  dataAdocao: dataAdocaoSchema.optional(),
});
export type CreateAnimalDTO = z.infer<typeof createAnimalSchema>;

/** Para `adotado`, `adotante` e `dataAdocao` são obrigatórios (regra em `Animal.changeStatus`). */
export const updateAnimalStatusSchema = z.object({
  status: z.enum(ANIMAL_STATUSES),
  adotante: adotanteSchema.optional(),
  dataAdocao: dataAdocaoSchema.optional(),
});
export type UpdateAnimalStatusDTO = z.infer<typeof updateAnimalStatusSchema>;

/**
 * PUT /api/animals/:id — edita os dados do animal (não mexe em status, foto nem adoção).
 * Substitui os dados: `idadeTexto` e `descricao` ausentes ou null apagam o texto.
 */
export const updateAnimalSchema = z.object({
  nome: createAnimalSchema.shape.nome,
  especie: z.enum(ESPECIES),
  raca: z.string().trim().min(1, "raca é obrigatória"),
  porte: camposPublicosSchema.porte,
  faixaEtaria: camposPublicosSchema.faixaEtaria,
  idadeTexto: camposPublicosSchema.idadeTexto.nullish(),
  descricao: camposPublicosSchema.descricao.nullish(),
});
export type UpdateAnimalDTO = z.infer<typeof updateAnimalSchema>;

export const animalIdParamSchema = z.object({
  id: z.string().uuid("id inválido"),
});
