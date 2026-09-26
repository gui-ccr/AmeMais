import { ValidationError } from "@/core/errors";

export const ShelterStatusValue  = 
[
    "disponivel",
    "ocupado",
    "em_avaliacao",
    "inativo"
]as const;

export type ShelterStatusValue = (typeof ShelterStatusValue)[number];
/**
 * Matriz de transição de status para Lares Temporários.
 * Fluxo sequencial: disponível -> ocupado -> em avaliação -> inativo -> disponível
 */
const MATRIZ_TRANSICAO: Record<
  ShelterStatusValue,
  readonly ShelterStatusValue[]
> = {
  disponivel: ["ocupado"],
  ocupado: ["em_avaliacao"],
  em_avaliacao: ["inativo"],
  inativo: ["disponivel"],
};

/**
 * Value Object para o status do Lar Temporário.
 * Garante imutabilidade e encapsula a regra de transição de estados.
 */
export class ShelterStatus {
  private constructor(private readonly _valor: ShelterStatusValue) {}

  /**
   * Factory method para instanciar e validar um Value Object.
   */
  static from(valor: string): ShelterStatus {
    const statusValidos: ShelterStatusValue[] = [
      "disponivel",
      "ocupado",
      "em_avaliacao",
      "inativo",
    ];

    if (!statusValidos.includes(valor as ShelterStatusValue)) {
      throw new ValidationError(`Status de lar temporário inválido: "${valor}"`);
    }

    return new ShelterStatus(valor as ShelterStatusValue);
  }

  get valor(): ShelterStatusValue {
    return this._valor;
  }

  /**
   * Verifica se é possível transicionar do status atual para o novo status recebido.
   */
  podeTransicionarPara(novoStatus: ShelterStatus): boolean {
    const proximosStatusPermitidos = MATRIZ_TRANSICAO[this._valor];
    return proximosStatusPermitidos.includes(novoStatus.valor);
  }

  /**
   * Compara se este Value Object é igual a outro.
   */
  equals(outro: ShelterStatus): boolean {
    return this._valor === outro.valor;
  }

  toString(): string {
    return this._valor;
  }
}