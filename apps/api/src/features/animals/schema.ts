import { z } from "zod";
import { ESPECIES } from "./domain/animal-options";
import { ANIMAL_STATUSES } from "./domain/animal-status.vo";

/**
 * Schemas Zod: validam o que chega pela requisição. Os tipos inferidos
 * daqui são os DTOs de entrada usados pelo controller e repassados,
 * já validados, para o use case.
 */
/**
 * Só o FORMATO do adotante é conferido aqui; as regras (idade entre 1 e 120,
 * CEP com 8 dígitos, textos mínimos) moram no Value Object `Adotante`.
 */
const adotanteSchema = z.object({
  nome: z.string(),
  idade: z.number(),
  cep: z.string(),
  localidade: z.string(),
});

export const createAnimalSchema = z.object({
  nome: z.string().min(2, "nome deve ter pelo menos 2 caracteres"),
  especie: z.enum(ESPECIES).optional(),
  raca: z.string().optional(),
  status: z.enum(ANIMAL_STATUSES).default("disponivel"),
  urlFoto: z.string().url().optional(),
  adotante: adotanteSchema.optional(),
  dataAdocao: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dataAdocao deve estar no formato AAAA-MM-DD")
    .optional(),
});
export type CreateAnimalDTO = z.infer<typeof createAnimalSchema>;

export const updateAnimalStatusSchema = z.object({
  status: z.enum(ANIMAL_STATUSES),
});
export type UpdateAnimalStatusDTO = z.infer<typeof updateAnimalStatusSchema>;

export const animalIdParamSchema = z.object({
  id: z.string().uuid("id inválido"),
});
