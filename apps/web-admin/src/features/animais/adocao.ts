import { z } from "zod";
import { cepSchema } from "@/lib/validations";
import { diaDeHoje } from "@/utils";
import type { Adocao } from "./types";

/**
 * Campos da adoção, compartilhados pelo cadastro (quando o animal já nasce
 * `adotado`) e pela troca de status (quando passa a `adotado`). As regras
 * espelham as do back (`Adotante` e `Animal.changeStatus`), que revalida tudo.
 */
export const adocaoSchema = z.object({
  adotanteNome: z.string().trim().min(2, "Informe o nome do adotante"),
  adotanteIdade: z.preprocess(
    (valor) => (valor === "" || valor === null || valor === undefined ? undefined : Number(valor)),
    z
      .number({ required_error: "Informe a idade do adotante", invalid_type_error: "Informe a idade do adotante" })
      .int("A idade deve ser um número inteiro")
      .min(1, "Informe uma idade válida")
      .max(120, "Informe uma idade válida"),
  ),
  cep: cepSchema,
  localidade: z.string().trim().min(2, "Informe a localidade"),
  dataAdocao: z
    .string()
    .min(1, "Informe a data da adoção")
    .refine((valor) => !Number.isNaN(Date.parse(valor)), "A data informada é inválida")
    // O back também recusa: ninguém adota amanhã.
    .refine((valor) => valor <= diaDeHoje(), "A data da adoção não pode ser no futuro"),
});

/** Valores do formulário (o que o usuário digitou) e valores já validados. */
export type AdocaoFormEntrada = z.input<typeof adocaoSchema>;
export type AdocaoFormSaida = z.output<typeof adocaoSchema>;

/**
 * Campos da adoção como entram num schema maior. Ficam "soltos" (só texto) de
 * propósito: só são validados de verdade quando o status é `adotado`, por
 * `exigirAdocaoSeAdotado`.
 */
export const camposDaAdocaoSoltos = {
  adotanteNome: z.string(),
  adotanteIdade: z.unknown(),
  cep: z.string(),
  localidade: z.string(),
  dataAdocao: z.string(),
};

export const ADOCAO_VAZIA = {
  adotanteNome: "",
  adotanteIdade: "",
  cep: "",
  localidade: "",
  dataAdocao: "",
};

/** Usado em `superRefine`: com status `adotado`, os campos da adoção passam a ser obrigatórios. */
export function exigirAdocaoSeAdotado(valores: { status: string }, ctx: z.RefinementCtx): void {
  if (valores.status !== "adotado") return;

  const resultado = adocaoSchema.safeParse(valores);
  if (resultado.success) return;

  for (const problema of resultado.error.issues) {
    ctx.addIssue({ code: "custom", path: problema.path, message: problema.message });
  }
}

/** Dos valores validados do formulário para o que o service envia. */
export function paraAdocao(valores: AdocaoFormSaida): Adocao {
  return {
    adotante: {
      nome: valores.adotanteNome,
      idade: valores.adotanteIdade,
      cep: valores.cep,
      localidade: valores.localidade,
    },
    dataAdocao: valores.dataAdocao,
  };
}
