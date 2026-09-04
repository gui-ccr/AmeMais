import { z } from "zod";

const FORMATO_DATA_BR = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** Valida data no formato DD/MM/AAAA como data de calendário real (rejeita 31/02/2026, por exemplo). */
export function isValidDataBR(value: string): boolean {
  const match = value.match(FORMATO_DATA_BR);
  if (!match) return false;

  const dia = Number(match[1]);
  const mes = Number(match[2]);
  const ano = Number(match[3]);

  if (mes < 1 || mes > 12) return false;

  const ultimoDiaDoMes = new Date(ano, mes, 0).getDate();
  return dia >= 1 && dia <= ultimoDiaDoMes;
}

export const dataSchema = z
  .string()
  .min(1, "Data é obrigatória")
  .refine(isValidDataBR, "A data informada é inválida");
