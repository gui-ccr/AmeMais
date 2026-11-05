import { z } from "zod";
import { CATEGORIAS_DOACAO, UNIDADES_DOACAO } from "./domain/doacao.entity";
import { isValidCpf } from "./cpf";

const dataEntradaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "dataEntrada deve estar no formato AAAA-MM-DD")
  .refine((valor) => !Number.isNaN(Date.parse(valor)), "dataEntrada deve ser uma data válida");

/** Texto opcional do doador: vazio ou ausente vira null. */
const textoOpcional = z
  .string()
  .trim()
  .nullish()
  .transform((valor) => (valor ? valor : null));

export const createDoacaoSchema = z.object({
  descricao: z.string().trim().min(2, "descricao deve ter pelo menos 2 caracteres"),
  quantidade: z
    .number({ invalid_type_error: "quantidade deve ser um número" })
    .positive("quantidade deve ser maior que zero"),
  unidade: z.enum(UNIDADES_DOACAO),
  categoria: z.enum(CATEGORIAS_DOACAO),
  localColeta: z.string().trim().min(2, "localColeta deve ter pelo menos 2 caracteres"),
  dataEntrada: dataEntradaSchema,
  urlFoto: z.string().url("urlFoto deve ser uma URL válida").nullable().default(null),
  urgenciaId: z.string().uuid("urgenciaId inválido").nullable().default(null),
  doadorNome: textoOpcional,
  doadorTelefone: textoOpcional,
  doadorCpf: textoOpcional.refine((valor) => valor === null || isValidCpf(valor), "doadorCpf inválido"),
});
export type CreateDoacaoDTO = z.infer<typeof createDoacaoSchema>;

/**
 * Edição parcial: só os campos enviados mudam. `.partial()` deixaria os defaults
 * (`null`) preencherem campos não enviados e apagar foto/urgência sem querer, por
 * isso os campos opcionais são redeclarados sem default.
 */
export const updateDoacaoSchema = createDoacaoSchema
  .partial()
  .extend({
    urlFoto: z.string().url("urlFoto deve ser uma URL válida").nullable().optional(),
    urgenciaId: z.string().uuid("urgenciaId inválido").nullable().optional(),
    doadorNome: z.string().trim().nullable().optional().transform((v) => (v === undefined ? undefined : v || null)),
    doadorTelefone: z.string().trim().nullable().optional().transform((v) => (v === undefined ? undefined : v || null)),
    doadorCpf: z
      .string()
      .trim()
      .nullable()
      .optional()
      .refine((v) => !v || isValidCpf(v), "doadorCpf inválido")
      .transform((v) => (v === undefined ? undefined : v || null)),
  })
  .refine((valores) => Object.values(valores).some((v) => v !== undefined), "informe ao menos um campo para atualizar");
export type UpdateDoacaoDTO = z.infer<typeof updateDoacaoSchema>;

export const doacaoIdParamSchema = z.object({
  id: z.string().uuid("id inválido"),
});
