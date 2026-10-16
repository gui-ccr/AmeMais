import { z } from "zod";


const dataEventoSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: "dataEvento deve ser uma data válida (ISO 8601)",
});

export const createEventSchema = z.object({
  titulo: z.string().min(2, "titulo deve ter pelo menos 2 caracteres"),
  descricao: z.string().min(1).optional(),
  dataEvento: dataEventoSchema.optional(),
  isActive: z.boolean().default(false),
});
export type CreateEventDTO = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial().extend({
  descricao: z.string().nullable().optional(),
  dataEvento: dataEventoSchema.nullable().optional(),
});
export type UpdateEventDTO = z.infer<typeof updateEventSchema>;

export const eventIdParamSchema = z.object({
  id: z.string().uuid("id inválido"),
});
