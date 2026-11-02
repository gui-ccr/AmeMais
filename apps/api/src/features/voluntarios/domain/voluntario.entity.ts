import { ValidationError } from "@/core/errors";
import { AreaDeAjuda } from "./area-de-ajuda.vo";
import { StatusVoluntario } from "./status-voluntario.vo";
import { TipoVoluntario, type TipoVoluntarioValue } from "./tipo-voluntario.vo";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export function normalizarTelefone(valor: string): string {
  return (valor ?? "").replace(/\D/g, "");
}

/** Estado completo de um voluntário já persistido. */
export interface VoluntarioProps {
  id: string;
  nome: string;
  email: string | null;
  telefone: string;
  tipo: TipoVoluntario;
  bairro: string | null;
  areasDeAjuda: AreaDeAjuda[];
  status: StatusVoluntario;
  createdAt: string;
}

export interface NewVoluntarioProps {
  nome: string;
  email?: string | null;
  telefone: string;
  tipo: TipoVoluntarioValue;
  bairro?: string | null;
  areasDeAjuda?: readonly string[];
}

/** Dados já validados e normalizados por `Voluntario.create()`, prontos para persistir. */
export type VoluntarioCreationData = Omit<VoluntarioProps, "id" | "createdAt">;


export class Voluntario {
  private constructor(private props: VoluntarioProps) {}

  /** Reconstrói a entidade a partir de dados já persistidos (chamado só pelo mapper). */
  static restore(props: VoluntarioProps): Voluntario {
    return new Voluntario(props);
  }

  /** Valida as regras de cadastro e devolve os dados prontos para persistir. */
  static create(input: NewVoluntarioProps): VoluntarioCreationData {
    return {
      ...Voluntario.validarDados(input),
      status: StatusVoluntario.from("ativo"),
    };
  }

  update(input: NewVoluntarioProps): void {
    const dados = Voluntario.validarDados(input);
    this.props.nome = dados.nome;
    this.props.email = dados.email;
    this.props.telefone = dados.telefone;
    this.props.tipo = dados.tipo;
    this.props.bairro = dados.bairro;
    this.props.areasDeAjuda = dados.areasDeAjuda;
  }

  /** Ativa/inativa o voluntário — o lar vinculado não é tocado. */
  alterarStatus(status: string): void {
    this.props.status = StatusVoluntario.from(status);
  }

  /** Regras de validação/normalização compartilhadas por `create()` e `update()`. */
  private static validarDados(input: NewVoluntarioProps): Omit<VoluntarioCreationData, "status"> {
    const nome = input.nome?.trim();
    if (!nome || nome.length < 2) {
      throw new ValidationError("nome deve ter pelo menos 2 caracteres");
    }

    const email = Voluntario.validarEmail(input.email);

    const telefone = normalizarTelefone(input.telefone);
    if (!/^\d{10,11}$/.test(telefone)) {
      throw new ValidationError("telefone deve conter 10 ou 11 números (DDD + número)");
    }

    const tipo = TipoVoluntario.from(input.tipo);

    const bairro = input.bairro?.trim() || null;

    const areasDeAjuda = Voluntario.validarAreasDeAjuda(input.areasDeAjuda ?? []);

    return { nome, email, telefone, tipo, bairro, areasDeAjuda };
  }


  private static validarEmail(email: string | null | undefined): string | null {
    if (email === null || email === undefined) return null;

    if (!EMAIL_REGEX.test(email)) {
      throw new ValidationError("email inválido");
    }
    return email;
  }

  /** Só os 4 valores permitidos, sem repetição — checada pelos valores crus, antes de virar Value Object. */
  private static validarAreasDeAjuda(areas: readonly string[]): AreaDeAjuda[] {
    if (new Set(areas).size !== areas.length) {
      throw new ValidationError("areasDeAjuda não pode conter valores repetidos");
    }
    return areas.map((area) => AreaDeAjuda.from(area));
  }

  get id(): string {
    return this.props.id;
  }
  get nome(): string {
    return this.props.nome;
  }
  get email(): string | null {
    return this.props.email;
  }
  get telefone(): string {
    return this.props.telefone;
  }
  get tipo(): TipoVoluntario {
    return this.props.tipo;
  }
  get bairro(): string | null {
    return this.props.bairro;
  }
  get areasDeAjuda(): AreaDeAjuda[] {
    return this.props.areasDeAjuda;
  }
  get status(): StatusVoluntario {
    return this.props.status;
  }
  get createdAt(): string {
    return this.props.createdAt;
  }
}
