import { ValidationError } from "@/core/errors";
import { AreaDeAjuda } from "./area-de-ajuda.vo";
import { StatusVoluntario } from "./status-voluntario.vo";
import { TipoVoluntario, type TipoVoluntarioValue } from "./tipo-voluntario.vo";

/** Formato bem simples de e-mail — o mesmo que o schema Zod usa na borda (`z.string().email()`). */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Remove tudo que não é dígito. Único ponto de normalização de telefone —
 * usado tanto pelo schema Zod (na borda) quanto por `Voluntario.create()`
 * (no domínio), pra nunca haver dois resultados diferentes dependendo de
 * quem chama primeiro.
 */
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

/**
 * Dados de entrada para cadastrar um voluntário novo. Sem `status`: todo
 * voluntário nasce "ativo" — mudar de status é operação própria (fora do
 * escopo desta tarefa, ver ticket KAN-81).
 */
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

/**
 * Entidade de domínio Voluntario: tem identidade (`id`) e centraliza as
 * invariantes que garantem que um voluntário nunca fique num estado
 * inválido (nome curto, telefone com tamanho errado, e-mail malformado,
 * área de ajuda desconhecida ou repetida).
 */
export class Voluntario {
  private constructor(private props: VoluntarioProps) {}

  /** Reconstrói a entidade a partir de dados já persistidos (chamado só pelo mapper). */
  static restore(props: VoluntarioProps): Voluntario {
    return new Voluntario(props);
  }

  /** Valida as regras de cadastro e devolve os dados prontos para persistir. */
  static create(input: NewVoluntarioProps): VoluntarioCreationData {
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

    return {
      nome,
      email,
      telefone,
      tipo,
      bairro,
      areasDeAjuda,
      status: StatusVoluntario.from("ativo"),
    };
  }

  /**
   * `null`/`undefined` = não informado (permitido pelo contrato). Qualquer
   * outro valor passa pela validação de formato — nunca é silenciosamente
   * trocado por `null` só porque está malformado.
   */
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
