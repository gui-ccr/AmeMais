import { randomInt } from "node:crypto";

// Sem caracteres ambíguos (0/O, 1/l/I): a senha é lida da tela e repassada à pessoa.
const MAIUSCULAS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const MINUSCULAS = "abcdefghijkmnpqrstuvwxyz";
const DIGITOS = "23456789";
const SIMBOLOS = "!@#$%&*?";
const TODOS = MAIUSCULAS + MINUSCULAS + DIGITOS + SIMBOLOS;

export const TAMANHO_SENHA_PROVISORIA = 16;

const sortear = (alfabeto: string) => alfabeto[randomInt(alfabeto.length)]!;

/**
 * Senha provisória aleatória (CSPRNG do Node), com pelo menos uma maiúscula, uma minúscula,
 * um dígito e um símbolo. Vai para a resposta HTTP uma única vez: nunca é logada nem guardada.
 */
export function gerarSenhaProvisoria(tamanho: number = TAMANHO_SENHA_PROVISORIA): string {
  if (tamanho < 12) throw new RangeError("A senha provisória deve ter pelo menos 12 caracteres");

  const caracteres = [sortear(MAIUSCULAS), sortear(MINUSCULAS), sortear(DIGITOS), sortear(SIMBOLOS)];
  while (caracteres.length < tamanho) caracteres.push(sortear(TODOS));

  // Fisher-Yates: os 4 obrigatórios não ficam sempre no começo.
  for (let i = caracteres.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [caracteres[i], caracteres[j]] = [caracteres[j]!, caracteres[i]!];
  }
  return caracteres.join("");
}
