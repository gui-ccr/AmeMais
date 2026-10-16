import { z } from "zod";
import { ShelterStatusValue } from "./domain/shelter-status.vo";

/**
 * Schemas Zod: validam o que chega pela requisição. Os tipos inferidos
 * daqui são os DTOs de entrada usados pelo controller e repassados,
 * já validados, para o use case.
 */
export const createShelterSchema = z.object({
  nomeResponsavel: z.string().min(2, "nome do responsável deve ter pelo menos 2 caracteres"),
  contato: z.string().min(1, "contato é obrigatório"),
  capacidade: z.number().int().positive("capacidade deve ser um número maior que zero"),
  enderecoRegiao: z.string().min(1, "endereço/região é obrigatório"),
  status: z.enum(ShelterStatusValue).default("disponivel"),
});
export type CreateShelterDTO = z.infer<typeof createShelterSchema>;

export const updateShelterStatusSchema = z.object({
  status: z.enum(ShelterStatusValue),
});
export type UpdateShelterStatusDTO = z.infer<typeof updateShelterStatusSchema>;

export const shelterIdParamSchema = z.object({
  id: z.string().uuid("id inválido"),
});


export const listSheltersQuerySchema = z.object({
  status: z.enum(ShelterStatusValue).optional(),
  busca: z
    .string()
    .optional()
    .transform((valor) => valor?.trim() || undefined),
  comVagas: z
    .string()
    .optional()
    .refine((valor) => valor === undefined || valor === "true" || valor === "false", {
      message: "comVagas deve ser 'true' ou 'false'",
    })
    .transform((valor) => (valor === undefined ? undefined : valor === "true")),
  limit: z.preprocess(
    (valor) => (valor === "" ? NaN : valor),
    z.coerce
      .number()
      .int("limit deve ser um número inteiro")
      .min(1, "limit deve ser no mínimo 1")
      .max(100, "limit deve ser no máximo 100")
      .default(20),
  ),
  offset: z.preprocess(
    (valor) => (valor === "" ? NaN : valor),
    z.coerce.number().int("offset deve ser um número inteiro").min(0, "offset não pode ser negativo").default(0),
  ),
});
export type ListSheltersQuery = z.infer<typeof listSheltersQuerySchema>;

