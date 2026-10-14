import { ValidationError } from "@/core/errors";

/** Mesmos dois valores do CHECK `voluntarios_tipo_check` (migration 20261006183000). */
export const TIPOS_VOLUNTARIO = ["veterinario", "apoio_geral"] as const;
export type TipoVoluntarioValue = (typeof TIPOS_VOLUNTARIO)[number];

/**
 * Value Object: o tipo de voluntário como valor imutável e sempre válido,
 * não uma string solta. Só existe via `from()`, que valida contra os
 * valores possíveis — mesmo padrão de `AnimalStatus`/`ShelterStatus`.
 */
export class TipoVoluntario {
  private constructor(private readonly _valor: TipoVoluntarioValue) {}

  static from(valor: string): TipoVoluntario {
    if (!TIPOS_VOLUNTARIO.includes(valor as TipoVoluntarioValue)) {
      throw new ValidationError(
        `tipo de voluntário inválido: "${valor}" — valores aceitos: "${TIPOS_VOLUNTARIO.join('", "')}"`,
      );
    }
    return new TipoVoluntario(valor as TipoVoluntarioValue);
  }

  get valor(): TipoVoluntarioValue {
    return this._valor;
  }

  equals(outro: TipoVoluntario): boolean {
    return this._valor === outro._valor;
  }

  toString(): string {
    return this._valor;
  }
}
