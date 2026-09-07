import { ValidationError } from "@/core/errors";

/**
 * Value Object: a data de um evento como valor imutável e sempre válido,
 * não uma string solta. Só existe via `from()`, que valida o formato; a
 * regra "está no passado?" (usada pela entidade para decidir se um evento
 * pode ser publicado) fica encapsulada aqui dentro, não espalhada pelos
 * use cases.
 */
export class EventDate {
  private constructor(private readonly value: string) {}

  static from(value: string): EventDate {
    if (isNaN(Date.parse(value))) {
      throw new ValidationError("dataEvento deve ser uma data válida (ISO 8601)");
    }
    return new EventDate(value);
  }

  get valor(): string {
    return this.value;
  }

  equals(outro: EventDate): boolean {
    return this.value === outro.value;
  }

  estaNoPassado(): boolean {
    return Date.parse(this.value) < Date.now();
  }

  toString(): string {
    return this.value;
  }
}
