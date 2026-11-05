import { z } from "zod";
import { isValidTelefone } from "@/lib/validations/telefone";
import { formatPhone } from "@/utils";
import type { LarDetalhe, NovoLarInput } from "./types";

const MENSAGEM_CAPACIDADE = "Informe a capacidade (quantos animais o lar comporta)";

/**
 * Formulário de lar (cadastro e edição). As regras espelham as do back
 * (`createShelterSchema` e `Shelter.create`), que revalida tudo.
 */
export const larSchema = z.object({
  nomeResponsavel: z.string().trim().min(2, "Informe o nome do responsável (mínimo 2 letras)"),
  // Mesma regra de voluntários e do back: telefone com DDD (10 ou 11 números). Uma mensagem por vez.
  contato: z
    .string()
    .trim()
    .superRefine((valor, ctx) => {
      if (!valor) ctx.addIssue({ code: "custom", message: "Informe o telefone do responsável" });
      else if (!isValidTelefone(valor)) ctx.addIssue({ code: "custom", message: "O telefone informado é inválido" });
    }),
  capacidade: z.preprocess(
    (valor) => (valor === "" || valor === null || valor === undefined ? undefined : Number(valor)),
    z
      .number({ required_error: MENSAGEM_CAPACIDADE, invalid_type_error: MENSAGEM_CAPACIDADE })
      .int("A capacidade deve ser um número inteiro")
      .positive("A capacidade deve ser maior que zero"),
  ),
  enderecoRegiao: z.string().trim().min(1, "Informe o endereço ou a região"),
  aceitaGatos: z.boolean(),
  aceitaCachorros: z.boolean(),
  observacoes: z.string().trim().max(1000, "As observações podem ter no máximo 1000 caracteres"),
  /** Preenchido pela busca de voluntário (não é digitado); `null` = sem voluntário ligado. */
  voluntarioId: z.string().uuid().nullable(),
});

/**
 * Contato para mostrar/editar: telefone válido vira "(33) 99999-0000". Contato antigo (texto livre,
 * e-mail, número incompleto) aparece como foi gravado, para não ser mutilado.
 */
export function formatarContato(contato: string): string {
  return /^[ds()+.-]+$/.test(contato) && isValidTelefone(contato) ? formatPhone(contato) : contato;
}

/** Valores do formulário (o que a pessoa digitou) e valores já validados. */
export type LarFormEntrada = z.input<typeof larSchema>;
export type LarFormSaida = z.output<typeof larSchema>;

export const LAR_FORM_VAZIO = {
  nomeResponsavel: "",
  contato: "",
  capacidade: "",
  enderecoRegiao: "",
  aceitaGatos: false,
  aceitaCachorros: false,
  observacoes: "",
  voluntarioId: null,
} satisfies LarFormEntrada;

/** Valores iniciais do formulário de edição, a partir do lar gravado. */
export function paraValoresDoFormulario(lar: LarDetalhe): LarFormEntrada {
  return {
    nomeResponsavel: lar.nomeResponsavel,
    contato: formatarContato(lar.contato),
    capacidade: lar.capacidade,
    enderecoRegiao: lar.enderecoRegiao,
    aceitaGatos: lar.aceitaGatos,
    aceitaCachorros: lar.aceitaCachorros,
    observacoes: lar.observacoes,
    voluntarioId: lar.voluntarioId,
  };
}

/** Dos valores validados do formulário para o que o service recebe (cadastro e edição enviam os mesmos campos). */
export function paraDadosDoLar(valores: LarFormSaida): NovoLarInput {
  return {
    nomeResponsavel: valores.nomeResponsavel,
    // A API guarda o telefone só com os dígitos.
    contato: valores.contato.replace(/D/g, ""),
    capacidade: valores.capacidade,
    enderecoRegiao: valores.enderecoRegiao,
    aceitaGatos: valores.aceitaGatos,
    aceitaCachorros: valores.aceitaCachorros,
    observacoes: valores.observacoes || null,
    voluntarioId: valores.voluntarioId,
  };
}
