import { z } from "zod";

/**
 * Schemas Zod: validam o FORMATO do que chega pela requisição HTTP (tipos,
 * campos obrigatórios, limites estruturais).
 *
 * Não substituem as regras de domínio (ex.: "valorArrecadado não pode ser maior
 * que metaArrecadacao") — essas invariantes moram e estão centralizadas na
 * entidade Urgency através de `Urgency.create()`.
 *
 * Os tipos inferidos daqui são os DTOs de entrada usados pelo controller e
 * repassados, já validados estruturalmente, para os use cases.
 */
export const createUrgencySchema = z.object({
  titulo: z.string().min(1, "titulo é obrigatório"),
  descricao: z.string().optional().nullable(),
  metaArrecadacao: z.number().nonnegative("metaArrecadacao não pode ser negativa").optional().nullable(),
  valorArrecadado: z.number().nonnegative("valorArrecadado não pode ser negativo").default(0),
  isActive: z.boolean().default(false),
});
export type CreateUrgencyDTO = z.infer<typeof createUrgencySchema>;

export const updateUrgencySchema = z.object({
  titulo: z.string().min(1, "titulo é obrigatório").optional(),
  descricao: z.string().optional().nullable(),
  metaArrecadacao: z.number().nonnegative("metaArrecadacao não pode ser negativa").optional().nullable(),
  valorArrecadado: z.number().nonnegative("valorArrecadado não pode ser negativo").optional(),
  isActive: z.boolean().optional(),
});
export type UpdateUrgencyDTO = z.infer<typeof updateUrgencySchema>;

export const urgencyIdParamSchema = z.object({
  id: z.string().uuid("id inválido"),
});
