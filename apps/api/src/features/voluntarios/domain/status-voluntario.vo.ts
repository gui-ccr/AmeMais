import { ValidationError } from "@/core/errors";

/** Mesmos dois valores do CHECK `voluntarios_status_check` (migration 20261006183000). */
export const STATUS_VOLUNTARIO = ["ativo", "inativo"] as const;
export type StatusVoluntarioValue = (typeof STATUS_VOLUNTARIO)[number];

/**
 * Value Object: o status do voluntário como valor imutável e sempre válido.
 * Um voluntário sempre nasce "ativo" (`Voluntario.create()` não aceita
 * `status` como entrada — ver ticket) — este VO existe para que o status
 * persistido continue validado ao reconstruir a entidade (`restore()`) e
 * para a mudança de status em uma tarefa futura, que ainda não existe aqui.
 */
export class StatusVoluntario {
  private constructor(private readonly _valor: StatusVoluntarioValue) {}

  static from(valor: string): StatusVoluntario {
    if (!STATUS_VOLUNTARIO.includes(valor as StatusVoluntarioValue)) {
      throw new ValidationError(
        `status de voluntário inválido: "${valor}" — valores aceitos: "${STATUS_VOLUNTARIO.join('", "')}"`,
      );
    }
    return new StatusVoluntario(valor as StatusVoluntarioValue);
  }

  get valor(): StatusVoluntarioValue {
    return this._valor;
  }

  equals(outro: StatusVoluntario): boolean {
    return this._valor === outro._valor;
  }

  toString(): string {
    return this._valor;
  }
}
