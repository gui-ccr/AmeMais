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

