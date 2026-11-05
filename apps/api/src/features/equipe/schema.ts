import { z } from "zod";

export const NIVEIS_DE_ACESSO = ["total", "leitura"] as const;
export type NivelDeAcesso = (typeof NIVEIS_DE_ACESSO)[number];

const uuid = z.string().uuid("id inválido");

const nomeDeDepartamento = z
  .string()
  .trim()
  .min(2, "nome deve ter pelo menos 2 caracteres")
  .max(80, "nome deve ter no máximo 80 caracteres");

const descricaoDeDepartamento = z.string().trim().max(300, "descrição deve ter no máximo 300 caracteres");

const departamentoIds = z
  .array(uuid)
  .max(50, "informe no máximo 50 departamentos")
  .refine((ids) => new Set(ids).size === ids.length, "departamentoIds não pode conter valores repetidos");

export const membroIdParamSchema = z.object({ id: uuid });
export const departamentoIdParamSchema = z.object({ id: uuid });

export const listMembrosQuerySchema = z.object({
  busca: z
    .string()
    .max(100, "busca deve ter no máximo 100 caracteres")
    .optional()
    .transform((valor) => valor?.trim() || undefined),
});

export const createMembroSchema = z.object({
  nome: z.string().trim().min(2, "nome deve ter pelo menos 2 caracteres").max(120, "nome deve ter no máximo 120 caracteres"),
  email: z.string().trim().toLowerCase().email("email inválido").max(254, "email deve ter no máximo 254 caracteres"),
  departamentoIds: departamentoIds.default([]),
});
export type CreateMembroDTO = z.infer<typeof createMembroSchema>;

/** PUT substitui todos os departamentos do membro: a chave é obrigatória (lista vazia = sem departamento). */
export const updateDepartamentosDoMembroSchema = z.object({ departamentoIds });

export const updateStatusDoMembroSchema = z.object({ ativo: z.boolean() });

export const createDepartamentoSchema = z.object({
  nome: nomeDeDepartamento,
  descricao: descricaoDeDepartamento.nullable().optional().transform((valor) => valor || null),
});
export type CreateDepartamentoDTO = z.infer<typeof createDepartamentoSchema>;

/** PUT: nome e descrição sempre juntos (`descricao: null` apaga). */
export const updateDepartamentoSchema = z.object({
  nome: nomeDeDepartamento,
  descricao: descricaoDeDepartamento.nullable().transform((valor) => valor || null),
});
export type UpdateDepartamentoDTO = z.infer<typeof updateDepartamentoSchema>;

/** Matriz módulo × nível. `nivel: null` = nenhum acesso ao módulo. */
export const salvarMatrizSchema = z.object({
  permissoes: z
    .array(z.object({ moduloId: uuid, nivel: z.enum(NIVEIS_DE_ACESSO).nullable() }))
    .max(50, "informe no máximo 50 módulos")
    .refine((itens) => new Set(itens.map((item) => item.moduloId)).size === itens.length, "moduloId repetido nas permissões"),
});
export type SalvarMatrizDTO = z.infer<typeof salvarMatrizSchema>;

export const trocarMinhaSenhaSchema = z.object({
  senha: z.string().min(8, "senha deve ter pelo menos 8 caracteres").max(72, "senha deve ter no máximo 72 caracteres"),
});
