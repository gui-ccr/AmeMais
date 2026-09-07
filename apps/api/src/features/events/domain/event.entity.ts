import { ValidationError } from "@/core/errors";
import { EventDate } from "./event-date.vo";

/**
 * Estado completo de um evento já persistido (tem id e createdAt, que só
 * existem depois que o banco cria o registro). `dataEvento` é o Value
 * Object `EventDate`, não a string crua — ver event-date.vo.ts.
 */
export interface EventProps {
  id: string;
  titulo: string;
  descricao: string | null;
  dataEvento: EventDate | null;
  isActive: boolean;
  createdAt: string;
}

/**
 * Dados de entrada para cadastrar um evento novo, ainda sem id/createdAt.
 * `dataEvento` aqui ainda é a string crua (é o formato de entrada) — vira
 * VO dentro de `Event.create()`.
 */
export interface NewEventProps {
  titulo: string;
  descricao?: string | null;
  dataEvento?: string | null;
  isActive?: boolean;
}

/**
 * Dados aceitos para atualizar um evento existente — todos opcionais,
 * só os campos presentes são alterados.
 */
export interface UpdateEventProps {
  titulo?: string;
  descricao?: string | null;
  dataEvento?: string | null;
  isActive?: boolean;
}

/**
 * Entidade de domínio (DDD): tem identidade (`id`) e é dona das regras que
 * garantem que um Event nunca fique num estado inválido (ex.: título
 * vazio, publicado com data no passado).
 *
 * O estado (`props`) é privado — a única forma de alterar um evento já
 * existente é via `update()`, que revalida as mesmas invariantes da
 * criação.
 */
export class Event {
  private constructor(private props: EventProps) {}

  /**
   * Reconstrói a entidade a partir de dados já persistidos (chamado só
   * pelo mapper, ao ler uma linha do banco). Não revalida invariantes de
   * criação porque o dado já passou por elas quando foi criado.
   */
  static restore(props: EventProps): Event {
    return new Event(props);
  }

  /**
   * Valida as regras de negócio de cadastro e devolve os dados prontos
   * para persistir. Factory que garante que não existe caminho para criar
   * um Event fora das invariantes do domínio.
   */
  static create(input: NewEventProps): Omit<EventProps, "id" | "createdAt"> {
    const titulo = input.titulo?.trim();
    if (!titulo || titulo.length < 2) {
      throw new ValidationError("titulo deve ter pelo menos 2 caracteres");
    }

    const dataEvento = input.dataEvento ? EventDate.from(input.dataEvento) : null;
    const isActive = input.isActive ?? false;
    Event.validarPublicacao(isActive, dataEvento);

    return {
      titulo,
      descricao: input.descricao?.trim() || null,
      dataEvento,
      isActive,
    };
  }

  /**
   * Um evento só pode ficar visível ao público (`isActive`) se tiver data
   * definida e ela não estiver no passado — regra acionada via
   * `EventDate.estaNoPassado()`, não reimplementada aqui.
   */
  private static validarPublicacao(isActive: boolean, dataEvento: EventDate | null): void {
    if (!isActive) return;
    if (!dataEvento) {
      throw new ValidationError("não é possível publicar um evento sem data definida");
    }
    if (dataEvento.estaNoPassado()) {
      throw new ValidationError("não é possível publicar um evento com data no passado");
    }
  }

  get id(): string {
    return this.props.id;
  }
  get titulo(): string {
    return this.props.titulo;
  }
  get descricao(): string | null {
    return this.props.descricao;
  }
  get dataEvento(): EventDate | null {
    return this.props.dataEvento;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): string {
    return this.props.createdAt;
  }

  /**
   * Único jeito de alterar um evento existente. Revalida as mesmas
   * invariantes de `create()` para os campos informados — nunca deixa a
   * entidade transitar para um estado inválido.
   */
  update(input: UpdateEventProps): void {
    if (input.titulo !== undefined) {
      const titulo = input.titulo.trim();
      if (!titulo || titulo.length < 2) {
        throw new ValidationError("titulo deve ter pelo menos 2 caracteres");
      }
      this.props.titulo = titulo;
    }

    if (input.descricao !== undefined) {
      this.props.descricao = input.descricao?.trim() || null;
    }

    if (input.dataEvento !== undefined) {
      this.props.dataEvento = input.dataEvento ? EventDate.from(input.dataEvento) : null;
    }

    if (input.isActive !== undefined) {
      this.props.isActive = input.isActive;
    }

    Event.validarPublicacao(this.props.isActive, this.props.dataEvento);
  }
}
