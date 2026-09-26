import { z } from "zod";
import { ESPECIES } from "./domain/animal-options";
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

export const createAnimalSchema = z.object({
  nome: z.string().min(2, "nome deve ter pelo menos 2 caracteres"),
  especie: z.enum(ESPECIES).optional(),
  raca: z.string().optional(),
  status: z.enum(ANIMAL_STATUSES).default("disponivel"),
  urlFoto: z.string().url().optional(),
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

export const animalIdParamSchema = z.object({
  id: z.string().uuid("id inválido"),
});
