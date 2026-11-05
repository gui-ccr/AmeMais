import { z } from "zod";

/** Mesmas regras de apps/api/src/features/equipe/schema.ts (o servidor valida de novo). */
export const novoMembroSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome (mínimo 2 letras)").max(120, "Nome muito longo"),
  email: z.string().trim().toLowerCase().min(1, "Informe o e-mail").email("E-mail inválido"),
  departamentoIds: z.array(z.string()),
});
export type NovoMembroForm = z.infer<typeof novoMembroSchema>;

export const departamentoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome (mínimo 2 letras)").max(80, "Nome muito longo (máximo 80)"),
  descricao: z.string().trim().max(300, "Descrição muito longa (máximo 300)"),
});
export type DepartamentoForm = z.infer<typeof departamentoSchema>;
