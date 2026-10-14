import { ValidationError } from "@/core/errors";

/**
 * Mesmas 4 opções do CHECK `voluntarios_areas_check` (migration 20261006183000)
 * e do formulário público "Quero ser voluntário".
 */
export const AREAS_DE_AJUDA = ["lar_temporario", "transporte", "eventos", "divulgacao"] as const;
export type AreaDeAjudaValue = (typeof AREAS_DE_AJUDA)[number];

/**
 * Value Object: UMA área de ajuda. Um voluntário tem uma LISTA dessas
 * (`areasDeAjuda: AreaDeAjuda[]`) — a regra de "sem repetição" é de lista,
 * não de valor único, por isso mora em `Voluntario.create()`, não aqui
 * (mesma divisão de responsabilidade que `Adotante`/`Animal` já usam).
 */
export class AreaDeAjuda {
  private constructor(private readonly _valor: AreaDeAjudaValue) {}

  static from(valor: string): AreaDeAjuda {
    if (!AREAS_DE_AJUDA.includes(valor as AreaDeAjudaValue)) {
      throw new ValidationError(
        `área de ajuda inválida: "${valor}" — valores aceitos: "${AREAS_DE_AJUDA.join('", "')}"`,
      );
    }
    return new AreaDeAjuda(valor as AreaDeAjudaValue);
  }

  get valor(): AreaDeAjudaValue {
    return this._valor;
  }

  equals(outra: AreaDeAjuda): boolean {
    return this._valor === outra._valor;
  }

  toString(): string {
    return this._valor;
  }
}
