import { ValidationError } from "@/core/errors";

/** Fuso em que a ONG opera: é ele que define o que é "hoje" para um evento. */
const FUSO_DA_ONG = "America/Sao_Paulo";

/** Dia de hoje ("AAAA-MM-DD") no fuso da ONG. `en-CA` já formata nesse padrão. */
function hojeNoFusoDaOng(agora: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_DA_ONG }).format(agora);
}

/**
 * Value Object: a data de um evento como valor imutável e sempre válido,
 * não uma string solta. Só existe via `from()`, que valida o formato; a
 * regra "está no passado?" (usada pela entidade para decidir se um evento
 * pode ser publicado) fica encapsulada aqui dentro, não espalhada pelos
 * use cases.
 *
 * O evento é um compromisso de um DIA, não de um instante: o form manda
 * "AAAA-MM-DD" e o Postgres devolve "AAAA-MM-DDT00:00:00+00:00". Por isso
 * a comparação é por dia (a parte antes do "T"), e não por milissegundo —
 * comparar por instante fazia o evento "de hoje" virar passado às 21h do
 * dia anterior (00:00 UTC) no horário de Brasília.
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

  /** Dia do evento ("AAAA-MM-DD"), sem converter fuso. */
  get dia(): string {
    const [dia = ""] = this.value.split("T");
    return /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : new Date(this.value).toISOString().slice(0, 10);
  }

  equals(outro: EventDate): boolean {
    return this.value === outro.value;
  }

  /** Mesmo dia, mesmo que um venha como "AAAA-MM-DD" e o outro como ISO completo. */
  mesmoDiaQue(outro: EventDate): boolean {
    return this.dia === outro.dia;
  }

  /** Igualdade por dia entre duas datas opcionais (`null` só é igual a `null`). */
  static mesmoDia(a: EventDate | null, b: EventDate | null): boolean {
    if (!a || !b) return a === b;
    return a.mesmoDiaQue(b);
  }

  /** `true` só se o dia do evento já acabou: um evento de hoje ainda NÃO está no passado. */
  estaNoPassado(agora: Date = new Date()): boolean {
    return this.dia < hojeNoFusoDaOng(agora);
  }

  toString(): string {
    return this.value;
  }
}
