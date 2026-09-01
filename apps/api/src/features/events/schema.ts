import { z } from "zod";

/**
 * Schema base para validação de criação de eventos.
 * Valida obrigatoriamente nome, data (ISO/data válida), local e descrição,
 * bloqueando strings vazias ou apenas com espaços em branco.
 */
export const eventSchema = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório" })
    .trim()
    .min(1, "Nome é obrigatório"),
  data: z
    .string({ required_error: "Data é obrigatória" })
    .trim()
    .min(1, "Data é obrigatória")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Data deve ser uma data válida no formato ISO (ex: YYYY-MM-DD ou ISO 8601)",
    }),
  local: z
    .string({ required_error: "Local é obrigatório" })
    .trim()
    .min(1, "Local é obrigatório"),
  descricao: z
    .string({ required_error: "Descrição é obrigatória" })
    .trim()
    .min(1, "Descrição é obrigatória"),
});

/** Alias semântico para criação de eventos */
export const createEventSchema = eventSchema;

/** Schema para atualização parcial de eventos */
export const updateEventSchema = eventSchema.partial();

/** Schema para representação de evento retornado pelo backend / banco */
export const eventResponseSchema = eventSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().optional(),
});

/** Tipos inferidos a partir dos schemas */
export type EventInput = z.infer<typeof eventSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventResponse = z.infer<typeof eventResponseSchema>;
