import { BusinessRuleError, ValidationError } from "@/core/errors";
import { ShelterStatus, type ShelterStatusValue } from "./shelter-status.vo";

/**
 * Estado completo de um lar temporário já persistido no banco.
 */
export interface ShelterProps {
  id: string;
  nomeResponsavel: string;
  contato: string;
  capacidade: number;
  status: ShelterStatus;
  enderecoRegiao: string;
  aceitaGatos: boolean;
  aceitaCachorros: boolean;
  isActive: boolean;
  createdAt: string;
}

/**
 * Dados de entrada para cadastrar um novo lar temporário.
 */
export interface NewShelterProps {
  nomeResponsavel: string;
  contato: string;
  capacidade: number;
  enderecoRegiao: string;
  status?: ShelterStatusValue;
}

/** Campos que podem ser corrigidos depois do cadastro (KAN-77). */
export interface ShelterDadosEditaveis {
  nomeResponsavel?: string;
  contato?: string;
  capacidade?: number;
  enderecoRegiao?: string;
  aceitaGatos?: boolean;
  aceitaCachorros?: boolean;
}

/**
 * Entidade de domínio Shelter (Lar Temporário): possui identidade e
 * centraliza as invariantes do negócio.
 */
export class Shelter {
  private static readonly STATUSES_PERMITIDOS_NA_CRIACAO: readonly ShelterStatusValue[] = ["disponivel"];

  private constructor(private props: ShelterProps) {}

  /**
   * Reconstrói a entidade a partir de dados persistidos sem revalidar a criação.
   */
  static restore(props: ShelterProps): Shelter {
    return new Shelter(props);
  }

  /**
   * Factory Method para criação e validação de novos lares temporários.
   */
  static create(
    input: NewShelterProps,
  ): Pick<ShelterProps, "nomeResponsavel" | "contato" | "capacidade" | "enderecoRegiao" | "status"> {
    const nomeResponsavel = input.nomeResponsavel?.trim();
    if (!nomeResponsavel || nomeResponsavel.length < 2) {
      throw new ValidationError("nome do responsável deve ter pelo menos 2 caracteres");
    }

    const contato = input.contato?.trim();
    if (!contato) {
      throw new ValidationError("contato é obrigatório");
    }

    if (typeof input.capacidade !== "number" || input.capacidade < 1) {
      throw new ValidationError("capacidade deve ser um número maior que zero");
    }

    const enderecoRegiao = input.enderecoRegiao?.trim();
    if (!enderecoRegiao) {
      throw new ValidationError("endereço/região é obrigatório");
    }

    const statusValue = input.status ?? "em_avaliacao";
    if (!Shelter.STATUSES_PERMITIDOS_NA_CRIACAO.includes(statusValue)) {
      throw new ValidationError(
        `Um lar temporário não pode ser cadastrado com o status "${statusValue}" — ` +
          `o cadastro só aceita "${Shelter.STATUSES_PERMITIDOS_NA_CRIACAO.join('" ou "')}"`,
      );
    }

    return {
      nomeResponsavel,
      contato,
      capacidade: input.capacidade,
      enderecoRegiao,
      status: ShelterStatus.from(statusValue),
    };
  }

  get id(): string {
    return this.props.id;
  }
  get nomeResponsavel(): string {
    return this.props.nomeResponsavel;
  }
  get contato(): string {
    return this.props.contato;
  }
  get capacidade(): number {
    return this.props.capacidade;
  }
  get status(): ShelterStatus {
    return this.props.status;
  }
  get enderecoRegiao(): string {
    return this.props.enderecoRegiao;
  }
  get aceitaGatos(): boolean {
    return this.props.aceitaGatos;
  }
  get aceitaCachorros(): boolean {
    return this.props.aceitaCachorros;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): string {
    return this.props.createdAt;
  }

  /**
   * Altera o status validando a matriz de transição (KAN-80). Lar com
   * animais não pode ser inativado: primeiro é preciso tirar os animais.
   * `isActive` acompanha o status: falso só quando o lar fica inativo.
   */
  changeStatus(novoStatus: ShelterStatus, ocupacao: number): void {
    if (!this.props.status.podeTransicionarPara(novoStatus)) {
      throw new ValidationError(
        `Não é possível mudar o status de "${this.props.status.valor}" para "${novoStatus.valor}"`,
      );
    }
    if (novoStatus.isInativo && ocupacao > 0) {
      throw new BusinessRuleError(
        `Não é possível inativar um lar com ${ocupacao} animal(is). Tire os animais do lar antes.`,
      );
    }
    this.props.status = novoStatus;
    this.props.isActive = !novoStatus.isInativo;
  }

  /**
   * Corrige os dados do lar (KAN-77). A capacidade nunca pode ficar menor
   * que a quantidade de animais que já estão no lar.
   */
  atualizarDados(dados: ShelterDadosEditaveis, ocupacao: number): void {
    if (dados.capacidade !== undefined && dados.capacidade < ocupacao) {
      throw new BusinessRuleError(
        `A capacidade não pode ser menor que a ocupação atual: o lar tem ${ocupacao} animal(is).`,
      );
    }
    const definidos = Object.fromEntries(
      Object.entries(dados).filter(([, valor]) => valor !== undefined),
    ) as ShelterDadosEditaveis;
    this.props = { ...this.props, ...definidos };
  }

  /** Regras para colocar um animal no lar (KAN-78): lar ativo e com vaga. */
  garantirQuePodeReceberAnimal(ocupacao: number): void {
    if (!this.props.isActive || this.props.status.isInativo) {
      throw new BusinessRuleError("Não é possível colocar animal em um lar inativo");
    }
    if (ocupacao >= this.props.capacidade) {
      throw new BusinessRuleError(
        `O lar está cheio: capacidade de ${this.props.capacidade} animal(is) já atingida`,
      );
    }
  }
}
