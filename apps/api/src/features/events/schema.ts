import { z } from "zod";

/**
 * Schemas Zod: validam o que chega pela requisição. Os tipos inferidos
 * daqui são os DTOs de entrada usados pelo controller e repassados,
 * já validados, para o use case. Campos batem com as colunas reais da
 * tabela "events" (ver supabase/migrations/20260906220500_create_events_and_urgencies.sql).
 */
export const createEventSchema = z.object({
  titulo: z.string().min(2, "titulo deve ter pelo menos 2 caracteres"),
  descricao: z.string().min(1).optional(),
  dataEvento: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "dataEvento deve ser uma data válida (ISO 8601)",
    })
    .optional(),
  isActive: z.boolean().default(false),
});
export type CreateEventDTO = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial();
export type UpdateEventDTO = z.infer<typeof updateEventSchema>;

export const eventIdParamSchema = z.object({
  id: z.string().uuid("id inválido"),
});
