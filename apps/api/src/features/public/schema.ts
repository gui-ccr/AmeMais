import { z } from "zod";
import { PUBLIC_ESPECIES, PUBLIC_FAIXAS_ETARIAS, PUBLIC_PORTES } from "@amemais/shared-types";

/**
 * Filtros aceitos por `GET /api/public/animais`. Lista fechada: valor fora dela
 * dá 400, e parâmetro desconhecido é ignorado (nunca vira filtro livre).
 *
 * `limit` tem teto de 50: a rota é pública e não pode devolver a tabela inteira.
 */
export const publicAnimalsQuerySchema = z.object({
  especie: z.enum(PUBLIC_ESPECIES).optional(),
  porte: z.enum(PUBLIC_PORTES).optional(),
  idade: z.enum(PUBLIC_FAIXAS_ETARIAS).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(50),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});
export type PublicAnimalsQuery = z.infer<typeof publicAnimalsQuerySchema>;
