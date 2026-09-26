import { ValidationError } from "@/core/errors";
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

/**
 * Entidade de domínio Shelter (Lar Temporário): possui identidade e
 * centraliza as invariantes do negócio.
 */
export class Shelter {
  private static readonly STATUSES_PERMITIDOS_NA_CRIACAO: readonly ShelterStatusValue[] = [
    "disponivel",
  ];

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
  static create(input: NewShelterProps): Omit<ShelterProps, "id" | "createdAt" | "isActive"> {
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
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): string {
    return this.props.createdAt;
  }

  /**
   * Altera o status do lar temporário validando as transições via Value Object.
   */
  changeStatus(novoStatus: ShelterStatus): void {
    if (!this.props.status.podeTransicionarPara(novoStatus)) {
      throw new ValidationError(
        `Não é possível mudar o status de "${this.props.status.valor}" para "${novoStatus.valor}"`,
      );
    }
    this.props.status = novoStatus;
    
    // Atualiza a flag derivando da transição caso seja desativado
    if (novoStatus.valor === "inativo") {
      this.props.isActive = false;
    }
  }
}