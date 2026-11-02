import { z } from "zod";
import { AREAS_DE_AJUDA } from "./domain/area-de-ajuda.vo";
import { normalizarTelefone } from "./domain/voluntario.entity";
import { STATUS_VOLUNTARIO } from "./domain/status-voluntario.vo";
import { TIPOS_VOLUNTARIO } from "./domain/tipo-voluntario.vo";


export const createVoluntarioSchema = z.object({
  nome: z.string().min(2, "nome deve ter pelo menos 2 caracteres"),

  email: z.string().email("email inválido").nullable().optional(),

  telefone: z
    .string()
    .transform(normalizarTelefone)
    .refine((valor) => /^\d{10,11}$/.test(valor), "telefone deve conter 10 ou 11 números (DDD + número)"),
  tipo: z.enum(TIPOS_VOLUNTARIO),
  bairro: z.string().nullable().optional(),
  areasDeAjuda: z
    .array(z.enum(AREAS_DE_AJUDA))
    .default([])
    .refine((areas) => new Set(areas).size === areas.length, "areasDeAjuda não pode conter valores repetidos"),
});
export type CreateVoluntarioDTO = z.infer<typeof createVoluntarioSchema>;


export const listVoluntariosQuerySchema = z.object({
  busca: z
    .string()
    .optional()
    .transform((valor) => valor?.trim() || undefined),
  tipo: z.enum(TIPOS_VOLUNTARIO).optional(),
  status: z.enum(STATUS_VOLUNTARIO).optional(),
  area: z.enum(AREAS_DE_AJUDA).optional(),
  page: z.coerce.number().int("page deve ser um número inteiro").min(1, "page deve ser no mínimo 1").default(1),
  limit: z.coerce
    .number()
    .int("limit deve ser um número inteiro")
    .min(1, "limit deve ser no mínimo 1")
    .max(100, "limit deve ser no máximo 100")
    .default(20),
});
export type ListVoluntariosQuery = z.infer<typeof listVoluntariosQuerySchema>;

export const voluntarioIdParamSchema = z.object({
  id: z.string().uuid("id inválido"),
});


/**
 * PUT substitui o recurso inteiro: `email`, `bairro` e `areasDeAjuda` são obrigatórios (as chaves
 * precisam vir no corpo; `null` apaga de propósito). Assim, omitir um campo não apaga o dado por acidente.
 */
export const updateVoluntarioSchema = createVoluntarioSchema.extend({
  email: z.string().email("email inválido").nullable(),
  bairro: z.string().nullable(),
  areasDeAjuda: z
    .array(z.enum(AREAS_DE_AJUDA))
    .refine((areas) => new Set(areas).size === areas.length, "areasDeAjuda não pode conter valores repetidos"),
});
export type UpdateVoluntarioDTO = z.infer<typeof updateVoluntarioSchema>;

/** PATCH /:id/status — só ativa/inativa; os demais dados são editados via PUT. */
export const updateVoluntarioStatusSchema = z.object({
  status: z.enum(STATUS_VOLUNTARIO),
});
export type UpdateVoluntarioStatusDTO = z.infer<typeof updateVoluntarioStatusSchema>;
