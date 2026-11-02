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
  aceitaGatos: z.boolean().default(false),
  aceitaCachorros: z.boolean().default(false),
  observacoes: z.string().trim().max(1000, "observações deve ter no máximo 1000 caracteres").nullable().optional(),
  voluntarioId: z.string().uuid("voluntarioId inválido").nullable().optional(),
});
export type CreateShelterDTO = z.infer<typeof createShelterSchema>;

/**
 * Edição dos dados do lar (KAN-77). Todos os campos são opcionais (só vai o
 * que mudou), mas o corpo não pode vir vazio. O status não entra aqui:
 * ele muda pelo PATCH, que confere a matriz de transição.
 */
export const updateShelterSchema = z
  .object({
    nomeResponsavel: z.string().trim().min(2, "nome do responsável deve ter pelo menos 2 caracteres"),
    contato: z.string().trim().min(1, "contato é obrigatório"),
    capacidade: z.number().int().positive("capacidade deve ser um número maior que zero"),
    enderecoRegiao: z.string().trim().min(1, "endereço/região é obrigatório"),
    aceitaGatos: z.boolean(),
    aceitaCachorros: z.boolean(),
    observacoes: z.string().trim().max(1000, "observações deve ter no máximo 1000 caracteres").nullable(),
    voluntarioId: z.string().uuid("voluntarioId inválido").nullable(),
  })
  .strict()
  .partial()
  .refine((dados) => Object.keys(dados).length > 0, { message: "informe ao menos um campo para editar" });
export type UpdateShelterDTO = z.infer<typeof updateShelterSchema>;

/** Corpo do POST /api/lares/:id/animais (KAN-78). */
export const addAnimalToShelterSchema = z.object({
  animalId: z.string().uuid("animalId inválido"),
});

/** Parâmetros do DELETE /api/lares/:id/animais/:animalId (KAN-78). */
export const shelterAnimalParamSchema = z.object({
  id: z.string().uuid("id inválido"),
  animalId: z.string().uuid("animalId inválido"),
});

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

