import { z } from "zod";
import { PRIORIDADES_URGENCIA, TIPOS_DOACAO, UNIDADES_META } from "./domain/urgency-options";

/** Dia no formato AAAA-MM-DD (a existência real da data é conferida na entidade). */
const diaSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dataLimite deve estar no formato AAAA-MM-DD");

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
  unidade: z.enum(UNIDADES_META).optional(),
  prioridade: z.enum(PRIORIDADES_URGENCIA).optional(),
  tipo: z.enum(TIPOS_DOACAO).optional(),
  dataLimite: diaSchema.optional().nullable(),
  isActive: z.boolean().default(false),
});
export type CreateUrgencyDTO = z.infer<typeof createUrgencySchema>;

export const updateUrgencySchema = z.object({
  titulo: z.string().min(1, "titulo é obrigatório").optional(),
  descricao: z.string().optional().nullable(),
  metaArrecadacao: z.number().nonnegative("metaArrecadacao não pode ser negativa").optional().nullable(),
  valorArrecadado: z.number().nonnegative("valorArrecadado não pode ser negativo").optional(),
  unidade: z.enum(UNIDADES_META).optional(),
  prioridade: z.enum(PRIORIDADES_URGENCIA).optional(),
  tipo: z.enum(TIPOS_DOACAO).optional(),
  dataLimite: diaSchema.optional().nullable(),
  isActive: z.boolean().optional(),
});
export type UpdateUrgencyDTO = z.infer<typeof updateUrgencySchema>;

export const urgencyIdParamSchema = z.object({
  id: z.string().uuid("id inválido"),
});

export const registerDonationSchema = z.object({
  valor: z.number().positive("valor da doação deve ser maior que zero"),
});
export type RegisterDonationDTO = z.infer<typeof registerDonationSchema>;

