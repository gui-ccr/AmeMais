import { z } from "zod";
import { AREAS_DE_AJUDA } from "./domain/area-de-ajuda.vo";
import { normalizarTelefone } from "./domain/voluntario.entity";
import { TIPOS_VOLUNTARIO } from "./domain/tipo-voluntario.vo";

/**
 * Schema Zod: valida o que chega pela requisição. Reaproveita as mesmas
 * listas de valores dos Value Objects (`TIPOS_VOLUNTARIO`, `AREAS_DE_AJUDA`)
 * em vez de declarar os valores de novo aqui — se um valor novo for
 * adicionado, só precisa mudar num lugar.
 *
 * Sem `status`: um voluntário sempre nasce "ativo" (ver `Voluntario.create()`).
 */
export const createVoluntarioSchema = z.object({
  nome: z.string().min(2, "nome deve ter pelo menos 2 caracteres"),
  // null/undefined = não informado; qualquer outro valor precisa ser um e-mail válido
  // (nunca é silenciosamente trocado por null só por estar malformado).
  email: z.string().email("email inválido").nullable().optional(),
  // Normaliza (remove máscara) antes de validar a quantidade de dígitos — a
  // mesma função é usada por `Voluntario.create()`, pra nunca haver dois
  // resultados diferentes dependendo de quem valida primeiro.
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
