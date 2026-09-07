import { z } from "zod";

/**
 * Normaliza aliases comuns entre frontend e banco (camelCase -> snake_case, etc.)
 */
function normalizeAnimalInput(raw: unknown): unknown {
  if (raw && typeof raw === "object") {
    const record = { ...(raw as Record<string, unknown>) };

    if ("urlFoto" in record && !("url_foto" in record)) {
      record.url_foto = record["urlFoto"];
    }
    if ("statusAdocao" in record && !("status_adocao" in record)) {
      record.status_adocao = record["statusAdocao"];
    }
    if ("status" in record && !("status_adocao" in record)) {
      record.status_adocao = record["status"];
    }
    if ("tipo" in record && !("especie" in record)) {
      record.especie = record["tipo"];
    }
    if ("larTemporarioId" in record && !("lar_temporario_id" in record)) {
      record.lar_temporario_id = record["larTemporarioId"];
    }
    if ("adotanteId" in record && !("adotante_id" in record)) {
      record.adotante_id = record["adotanteId"];
    }
    if ("dataAdocao" in record && !("data_adocao" in record)) {
      record.data_adocao = record["dataAdocao"];
    }

    return record;
  }
  return raw;
}

/**
 * Schema para criação / cadastro de novos animais.
 * Valida obrigatoriedade de 'nome' e regras de formato dos campos.
 */
export const createAnimalSchema = z.preprocess(
  normalizeAnimalInput,
  z.object({
    nome: z
      .string({ required_error: "Nome é obrigatório" })
      .trim()
      .min(1, "Nome é obrigatório"),
    especie: z.string().trim().min(1, "Espécie não pode ser vazia").optional().nullable(),
    raca: z.string().trim().optional().nullable(),
    status_adocao: z.string().trim().min(1).default("Disponível"),
    lar_temporario_id: z.string().uuid("ID de lar temporário inválido").optional().nullable(),
    adotante_id: z.string().uuid("ID de adotante inválido").optional().nullable(),
    url_foto: z.string().trim().optional().nullable(),
    data_adocao: z
      .string()
      .trim()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Data de adoção deve ser uma data válida",
      })
      .optional()
      .nullable(),
  })
);

/**
 * Schema para edição / atualização parcial de animais.
 */
export const updateAnimalSchema = z.preprocess(
  normalizeAnimalInput,
  z.object({
    nome: z.string().trim().min(1, "Nome não pode ser vazio").optional(),
    especie: z.string().trim().min(1, "Espécie não pode ser vazia").optional().nullable(),
    raca: z.string().trim().optional().nullable(),
    status_adocao: z.string().trim().min(1, "Status não pode ser vazio").optional(),
    lar_temporario_id: z.string().uuid("ID de lar temporário inválido").optional().nullable(),
    adotante_id: z.string().uuid("ID de adotante inválido").optional().nullable(),
    url_foto: z.string().trim().optional().nullable(),
    data_adocao: z
      .string()
      .trim()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Data de adoção deve ser uma data válida",
      })
      .optional()
      .nullable(),
  })
);

/**
 * Schema para validação do retorno do animal
 */
export const animalResponseSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  especie: z.string().nullable().optional(),
  raca: z.string().nullable().optional(),
  status_adocao: z.string(),
  lar_temporario_id: z.string().uuid().nullable().optional(),
  adotante_id: z.string().uuid().nullable().optional(),
  url_foto: z.string().nullable().optional(),
  data_adocao: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type CreateAnimalInput = z.infer<typeof createAnimalSchema>;
export type UpdateAnimalInput = z.infer<typeof updateAnimalSchema>;
export type AnimalResponse = z.infer<typeof animalResponseSchema>;

export interface AnimalItem {
  id: string;
  nome: string;
  especie: string | null;
  raca: string | null;
  status_adocao: string;
  statusAdocao?: string;
  lar_temporario_id: string | null;
  larTemporarioId?: string | null;
  adotante_id: string | null;
  adotanteId?: string | null;
  url_foto: string | null;
  urlFoto?: string | null;
  data_adocao: string | null;
  dataAdocao?: string | null;
  created_at?: string;
  createdAt?: string;
}

