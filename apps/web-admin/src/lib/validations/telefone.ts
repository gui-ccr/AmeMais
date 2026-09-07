import { z } from "zod";

/** Aceita telefone fixo (10 dígitos: DDD + 8) ou celular (11 dígitos: DDD + 9). */
export function isValidTelefone(value: string): boolean {
  return /^\d{10,11}$/.test(value.replace(/\D/g, ""));
}

export const telefoneSchema = z
  .string()
  .min(1, "Telefone é obrigatório")
  .refine(isValidTelefone, "O telefone informado é inválido");
