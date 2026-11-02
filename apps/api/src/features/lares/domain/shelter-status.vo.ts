import { ValidationError } from "@/core/errors";

export const ShelterStatusValue = ["disponivel", "ocupado", "em_avaliacao", "inativo"] as const;

export type ShelterStatusValue = (typeof ShelterStatusValue)[number];

/**
 * Matriz de transição de status dos Lares Temporários (decidida no KAN-80).
 *
 * - Os status ativos (disponível, ocupado, em avaliação) andam livremente
 *   entre si: um lar ocupado volta direto para disponível quando o animal sai.
 * - Qualquer status ativo pode ir para inativo. Lar com animais não pode ser
 *   inativado; essa regra depende da ocupação e fica em `Shelter.changeStatus`.
 * - Um lar inativo só volta passando por avaliação.
 */
const MATRIZ_TRANSICAO: Record<ShelterStatusValue, readonly ShelterStatusValue[]> = {
  disponivel: ["ocupado", "em_avaliacao", "inativo"],
  ocupado: ["disponivel", "em_avaliacao", "inativo"],
  em_avaliacao: ["disponivel", "ocupado", "inativo"],
  inativo: ["em_avaliacao"],
};

/**
 * Value Object para o status do Lar Temporário.
 * Garante imutabilidade e encapsula a regra de transição de estados.
 */
export class ShelterStatus {
  private constructor(private readonly _valor: ShelterStatusValue) {}

  static from(valor: string): ShelterStatus {
    if (!ShelterStatusValue.includes(valor as ShelterStatusValue)) {
      throw new ValidationError(`Status de lar temporário inválido: "${valor}"`);
    }
    return new ShelterStatus(valor as ShelterStatusValue);
  }

  get valor(): ShelterStatusValue {
    return this._valor;
  }

  get isInativo(): boolean {
    return this._valor === "inativo";
  }

  /** Verifica se é possível ir do status atual para o novo status. */
  podeTransicionarPara(novoStatus: ShelterStatus): boolean {
    return MATRIZ_TRANSICAO[this._valor].includes(novoStatus.valor);
  }

  equals(outro: ShelterStatus): boolean {
    return this._valor === outro.valor;
  }

  toString(): string {
    return this._valor;
  }
}
