import { z } from "zod";

function calcularDigitoCPF(digitos: number[], pesoInicial: number): number {
  const soma = digitos.reduce((total, digito, index) => total + digito * (pesoInicial - index), 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/**
 * Valida CPF pelo algoritmo oficial de dígitos verificadores (módulo 11),
 * não só o formato — rejeita também sequências repetidas (ex: 111.111.111-11),
 * que passariam numa checagem só de regex.
 */
export function isValidCPF(value: string): boolean {
  const numeros = value.replace(/\D/g, "");

  if (numeros.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numeros)) return false;

  const digitos = numeros.split("").map(Number);

  const primeiroDigito = calcularDigitoCPF(digitos.slice(0, 9), 10);
  if (primeiroDigito !== digitos[9]) return false;

  const segundoDigito = calcularDigitoCPF(digitos.slice(0, 10), 11);
  if (segundoDigito !== digitos[10]) return false;

  return true;
}

export const cpfSchema = z
  .string()
  .min(1, "CPF é obrigatório")
  .refine(isValidCPF, "O CPF informado é inválido");
