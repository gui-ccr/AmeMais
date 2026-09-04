import { z } from "zod";

export function isValidCEP(value: string): boolean {
  return /^\d{8}$/.test(value.replace(/\D/g, ""));
}

export const cepSchema = z
  .string()
  .min(1, "CEP é obrigatório")
  .refine(isValidCEP, "O CEP informado é inválido");
