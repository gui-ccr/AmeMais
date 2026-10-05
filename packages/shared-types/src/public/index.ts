import { z } from "zod";

/**
 * Contrato das rotas PÚBLICAS da apps/api (`/api/public/*`), consumidas pelo
 * site público (apps/web-public) sem login.
 *
 * Regra de ouro: só entra aqui o que um visitante pode ver. Nada de dado de
 * adotante, de lar temporário ou de qualquer identificador interno — se um
 * campo não está neste arquivo, a API pública não pode devolvê-lo.
 *
 * A API monta as respostas a partir destes tipos e o site valida o que recebe
 * com os mesmos schemas, então os dois lados mudam juntos (ver ADR 0009).
 */

/** Envelope padrão da API: `{ data: ... }` (ver `ok()` em apps/api/src/core/http.ts). */
export function apiEnvelopeSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({ data });
}

// ---------------------------------------------------------------------------
// Animais disponíveis para adoção — GET /api/public/animais
// ---------------------------------------------------------------------------

export const PUBLIC_ESPECIES = ["Cachorro", "Gato", "Outro"] as const;
export const PUBLIC_PORTES = ["P", "M", "G"] as const;
export const PUBLIC_FAIXAS_ETARIAS = ["filhote", "adulto", "idoso"] as const;

export const publicAnimalSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  especie: z.enum(PUBLIC_ESPECIES),
  porte: z.enum(PUBLIC_PORTES),
  faixaEtaria: z.enum(PUBLIC_FAIXAS_ETARIAS),
  /** Texto livre pronto para exibir (ex.: "2 anos"). Opcional. */
  idadeTexto: z.string().nullable(),
  descricao: z.string().nullable(),
  urlFoto: z.string().url().nullable(),
});
export type PublicAnimal = z.infer<typeof publicAnimalSchema>;

export const publicAnimalListSchema = apiEnvelopeSchema(z.array(publicAnimalSchema));

// ---------------------------------------------------------------------------
// Urgências ativas — GET /api/public/urgencias
// ---------------------------------------------------------------------------

export const PUBLIC_PRIORIDADES_URGENCIA = ["urgente", "importante", "continua"] as const;
export const PUBLIC_UNIDADES_META = ["kg", "un", "L", "R$"] as const;

export const publicUrgencySchema = z.object({
  id: z.string().uuid(),
  titulo: z.string(),
  descricao: z.string().nullable(),
  prioridade: z.enum(PUBLIC_PRIORIDADES_URGENCIA),
  unidade: z.enum(PUBLIC_UNIDADES_META),
  /** Pode ser nulo/zero: o site não pode dividir por ela sem checar. */
  metaArrecadacao: z.number().nonnegative().nullable(),
  valorArrecadado: z.number().nonnegative(),
  /** Dia no formato AAAA-MM-DD. */
  dataLimite: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});
export type PublicUrgency = z.infer<typeof publicUrgencySchema>;

export const publicUrgencyListSchema = apiEnvelopeSchema(z.array(publicUrgencySchema));

// ---------------------------------------------------------------------------
// Pontos de coleta ativos — GET /api/public/pontos-coleta
// ---------------------------------------------------------------------------

export const publicCollectionPointSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  endereco: z.string(),
  horario: z.string().nullable(),
});
export type PublicCollectionPoint = z.infer<typeof publicCollectionPointSchema>;

export const publicCollectionPointListSchema = apiEnvelopeSchema(z.array(publicCollectionPointSchema));
