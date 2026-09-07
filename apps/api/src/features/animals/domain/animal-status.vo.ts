import { ValidationError } from "@/core/errors";

/** Status possíveis de um animal no sistema da ONG. */
export const ANIMAL_STATUSES = [
  "disponivel",
  "em_tratamento",
  "em_lar_temporario",
  "adotado",
] as const;

export type AnimalStatusValue = (typeof ANIMAL_STATUSES)[number];

/** Para cada status atual, os status de destino permitidos. */
const ALLOWED_TRANSITIONS: Record<AnimalStatusValue, readonly AnimalStatusValue[]> = {
  em_tratamento: ["disponivel", "em_lar_temporario"],
  disponivel: ["em_tratamento", "em_lar_temporario", "adotado"],
  em_lar_temporario: ["disponivel", "em_tratamento", "adotado"],
  // Devolução: volta pra triagem, nunca direto pra outro lar temporário sem reavaliação.
  adotado: ["disponivel", "em_tratamento"],
};

function podeAlterarStatus(statusAtual: AnimalStatusValue, novoStatus: AnimalStatusValue): boolean {
  if (statusAtual === novoStatus) return false;
  return ALLOWED_TRANSITIONS[statusAtual].includes(novoStatus);
}

/**
 * Value Object: o status de um animal como valor imutável e sempre válido,
 * não uma string solta. Só existe via `from()`, que valida; comparação é
 * por valor (`equals`); a matriz de transição fica encapsulada aqui dentro.
 */
export class AnimalStatus {
  private constructor(private readonly value: AnimalStatusValue) {}

  static from(value: string): AnimalStatus {
    if (!ANIMAL_STATUSES.includes(value as AnimalStatusValue)) {
      throw new ValidationError(`Status "${value}" não existe`);
    }
    return new AnimalStatus(value as AnimalStatusValue);
  }

  get valor(): AnimalStatusValue {
    return this.value;
  }

  equals(outro: AnimalStatus): boolean {
    return this.value === outro.value;
  }

  podeTransicionarPara(novoStatus: AnimalStatus): boolean {
    return podeAlterarStatus(this.value, novoStatus.value);
  }

  toString(): string {
    return this.value;
  }
}
