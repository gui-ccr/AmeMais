import { z } from "zod";

export const perfilSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(120, "Nome muito longo"),
  telefone: z
    .string()
    .trim()
    .refine((v) => v === "" || v.replace(/\D/g, "").length >= 10, "Informe um telefone com DDD")
    .optional(),
});

export type PerfilFormValues = z.infer<typeof perfilSchema>;
