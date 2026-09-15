import { z } from "zod";
import { ANIMAL_STATUSES } from "./domain/animal-status.vo";

/**
 * Schemas Zod: validam o que chega pela requisição. Os tipos inferidos
 * daqui são os DTOs de entrada usados pelo controller e repassados,
 * já validados, para o use case.
 */
export const createAnimalSchema = z.object({
  nome: z.string().min(2, "nome deve ter pelo menos 2 caracteres"),
  especie: z.string().min(1).optional(),
  raca: z.string().optional(),
  status: z.enum(ANIMAL_STATUSES).default("disponivel"),
  urlFoto: z.string().url().optional(),
});
export type CreateAnimalDTO = z.infer<typeof createAnimalSchema>;

export const updateAnimalStatusSchema = z.object({
  status: z.enum(ANIMAL_STATUSES),
});
export type UpdateAnimalStatusDTO = z.infer<typeof updateAnimalStatusSchema>;

export const animalIdParamSchema = z.object({
  id: z.string().uuid("id inválido"),
});
