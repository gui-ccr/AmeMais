import { z } from "zod";

const PESOS_PRIMEIRO_DIGITO = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_SEGUNDO_DIGITO = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function calcularDigitoCNPJ(digitos: number[], pesos: number[]): number {
  const soma = pesos.reduce((total, peso, index) => total + peso * (digitos[index] ?? 0), 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/**
 * Valida CNPJ pelo algoritmo oficial de dígitos verificadores (módulo 11),
 * não só o formato — mesma lógica do CPF, com pesos diferentes.
 */
export function isValidCNPJ(value: string): boolean {
  const numeros = value.replace(/\D/g, "");

  if (numeros.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(numeros)) return false;

  const digitos = numeros.split("").map(Number);

  const primeiroDigito = calcularDigitoCNPJ(digitos.slice(0, 12), PESOS_PRIMEIRO_DIGITO);
  if (primeiroDigito !== digitos[12]) return false;

  const segundoDigito = calcularDigitoCNPJ(digitos.slice(0, 13), PESOS_SEGUNDO_DIGITO);
  if (segundoDigito !== digitos[13]) return false;

  return true;
}

export const cnpjSchema = z
  .string()
  .min(1, "CNPJ é obrigatório")
  .refine(isValidCNPJ, "O CNPJ informado é inválido");
