import { z } from "zod";
import { STATUS_LAR, type Lar, type NovoLarInput } from "./types";

const MENSAGEM_CAPACIDADE = "Informe a capacidade (quantos animais o lar comporta)";
const MENSAGEM_STATUS = "Selecione o novo status";

/**
 * Formulário de lar (cadastro e edição). As regras espelham as do back
 * (`createShelterSchema` e `Shelter.create`), que revalida tudo.
 */
export const larSchema = z.object({
  nomeResponsavel: z.string().trim().min(2, "Informe o nome do responsável (mínimo 2 letras)"),
  contato: z.string().trim().min(1, "Informe o contato do responsável"),
  capacidade: z.preprocess(
    (valor) => (valor === "" || valor === null || valor === undefined ? undefined : Number(valor)),
    z
      .number({ required_error: MENSAGEM_CAPACIDADE, invalid_type_error: MENSAGEM_CAPACIDADE })
      .int("A capacidade deve ser um número inteiro")
      .positive("A capacidade deve ser maior que zero"),
  ),
  enderecoRegiao: z.string().trim().min(1, "Informe o endereço ou a região"),
});

/** Valores do formulário (o que a pessoa digitou) e valores já validados. */
export type LarFormEntrada = z.input<typeof larSchema>;
export type LarFormSaida = z.output<typeof larSchema>;

export const LAR_FORM_VAZIO = {
  nomeResponsavel: "",
  contato: "",
  capacidade: "",
  enderecoRegiao: "",
} satisfies LarFormEntrada;

/** Valores iniciais do formulário de edição, a partir do lar gravado. */
export function paraValoresDoFormulario(lar: Lar): LarFormEntrada {
  return {
    nomeResponsavel: lar.nomeResponsavel,
    contato: lar.contato,
    capacidade: lar.capacidade,
    enderecoRegiao: lar.enderecoRegiao,
  };
}

/** Dos valores validados do formulário para o que o service recebe (cadastro e edição enviam os mesmos 4 campos). */
export function paraDadosDoLar(valores: LarFormSaida): NovoLarInput {
  return {
    nomeResponsavel: valores.nomeResponsavel,
    contato: valores.contato,
    capacidade: valores.capacidade,
    enderecoRegiao: valores.enderecoRegiao,
  };
}

/** Formulário de troca de status. Quais destinos valem para cada status atual está em `TRANSICOES_STATUS_LAR`. */
export const alterarStatusLarSchema = z.object({
  status: z.enum(STATUS_LAR, { required_error: MENSAGEM_STATUS, invalid_type_error: MENSAGEM_STATUS }),
});

export type AlterarStatusLarFormEntrada = z.input<typeof alterarStatusLarSchema>;
export type AlterarStatusLarFormSaida = z.output<typeof alterarStatusLarSchema>;
