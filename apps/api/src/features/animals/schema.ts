import { z } from "zod";
import { ANIMAL_STATUSES } from "./domain/animal-status.vo";

/**
 * Dados do adotante informados no cadastro de um animal já adotado. As
 * mesmas faixas exigidas pela entidade (ver `Animal.create()`) já são
 * checadas aqui para virar um 400 com `issues` na borda HTTP, em vez de
 * só o `ValidationError` genérico do domínio.
 */
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
  adotante: adotanteSchema.optional(),
  dataAdocao: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dataAdocao deve estar no formato YYYY-MM-DD")
    .refine((val) => !isNaN(Date.parse(val)), { message: "dataAdocao deve ser uma data válida" })
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
