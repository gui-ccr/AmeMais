import { ValidationError } from "@/core/errors";

/** Dados como chegam de fora (JSON da requisição), ainda não validados. */
export interface AdotanteInput {
  nome: string;
  idade: number;
  cep: string;
  localidade: string;
}

export const IDADE_MINIMA_ADOTANTE = 1;
export const IDADE_MAXIMA_ADOTANTE = 120;

/**
 * Value Object: quem adotou o animal. Pessoa de fora da ONG, sem login — por
 * isso não é um `usuario`/`adotantes` do sistema, só quatro dados guardados no
 * próprio animal. Só existe via `from()`, que valida e normaliza:
 *  - nome e localidade "aparados" e com pelo menos 2 letras;
 *  - idade inteira entre 1 e 120;
 *  - CEP guardado só com os 8 dígitos (a máscara 00000-000 é coisa da tela;
 *    aceitamos os dois formatos na entrada).
 *
 * São dados pessoais: só existem enquanto o animal está `adotado` (a entidade
 * `Animal` e a migration garantem isso) e nunca devem ir para telas públicas.
 */
export class Adotante {
  private constructor(
    readonly nome: string,
    readonly idade: number,
    readonly cep: string,
    readonly localidade: string,
  ) {}

  static from(input: AdotanteInput): Adotante {
    const nome = input.nome?.trim();
    if (!nome || nome.length < 2) {
      throw new ValidationError("nome do adotante deve ter pelo menos 2 caracteres");
    }

    if (
      !Number.isInteger(input.idade) ||
      input.idade < IDADE_MINIMA_ADOTANTE ||
      input.idade > IDADE_MAXIMA_ADOTANTE
    ) {
      throw new ValidationError(
        `idade do adotante deve ser um número inteiro entre ${IDADE_MINIMA_ADOTANTE} e ${IDADE_MAXIMA_ADOTANTE}`,
      );
    }

    const cep = (input.cep ?? "").replace(/\D/g, "");
    if (cep.length !== 8) {
      throw new ValidationError("cep do adotante deve ter 8 dígitos");
    }

    const localidade = input.localidade?.trim();
    if (!localidade || localidade.length < 2) {
      throw new ValidationError("localidade do adotante deve ter pelo menos 2 caracteres");
    }

    return new Adotante(nome, input.idade, cep, localidade);
  }

  equals(outro: Adotante): boolean {
    return (
      this.nome === outro.nome &&
      this.idade === outro.idade &&
      this.cep === outro.cep &&
      this.localidade === outro.localidade
    );
  }
}
