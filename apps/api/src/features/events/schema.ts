import { z } from "zod";

/**
 * Schema base para validação de eventos.
 * Valida obrigatoriamente nome, data (ISO/data válida), local e descrição,
 * bloqueando strings vazias ou apenas com espaços em branco.
 * Aceita tanto 'descricao' quanto 'descrição' (via preprocess).
 */
export const eventSchema = z.preprocess(
  (raw: unknown) => {
    if (raw && typeof raw === "object") {
      const record = { ...(raw as Record<string, unknown>) };
      if ("descrição" in record && !("descricao" in record)) {
        record.descricao = record["descrição"];
      }
      if ("titulo" in record && !("nome" in record)) {
        record.nome = record["titulo"];
      }
      if ("dataEvento" in record && !("data" in record)) {
        record.data = record["dataEvento"];
      }
      return record;
    }
    return raw;
  },
  z.object({
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
  })
);

/** Alias semântico para criação de eventos */
export const createEventSchema = eventSchema;

/** Schema para atualização de eventos (campos opcionais) */
export const updateEventSchema = z.preprocess(
  (raw: unknown) => {
    if (raw && typeof raw === "object") {
      const record = { ...(raw as Record<string, unknown>) };
      if ("descrição" in record && !("descricao" in record)) {
        record.descricao = record["descrição"];
      }
      if ("titulo" in record && !("nome" in record)) {
        record.nome = record["titulo"];
      }
      if ("dataEvento" in record && !("data" in record)) {
        record.data = record["dataEvento"];
      }
      return record;
    }
    return raw;
  },
  z.object({
    nome: z.string().trim().min(1, "Nome não pode ser vazio").optional(),
    data: z
      .string()
      .trim()
      .min(1, "Data não pode ser vazia")
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Data deve ser uma data válida no formato ISO (ex: YYYY-MM-DD ou ISO 8601)",
      })
      .optional(),
    local: z.string().trim().min(1, "Local não pode ser vazio").optional(),
    descricao: z.string().trim().min(1, "Descrição não pode ser vazia").optional(),
  })
);

/** Schema para representação de evento retornado pelo backend / banco */
export const eventResponseSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  data: z.string(),
  local: z.string(),
  descricao: z.string(),
  createdAt: z.string().optional(),
  created_at: z.string().optional(),
});

/** Tipos inferidos a partir dos schemas */
export type EventInput = z.infer<typeof eventSchema>;
export type CreateEventInput = EventInput;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventResponse = z.infer<typeof eventResponseSchema>;

export interface EventItem {
  id: string;
  nome: string;
  data: string;
  local: string;
  descricao: string;
  createdAt?: string;
}

