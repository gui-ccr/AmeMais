import { ValidationError } from "@/core/errors";
import { AnimalStatus, type AnimalStatusValue } from "./animal-status.vo";

export interface AdotanteInfo {
  nome: string;
  idade: number;
  cep: string;
  localidade: string;
}


export interface AnimalProps {
  id: string;
  nome: string;
  especie: string | null;
  raca: string | null;
  status: AnimalStatus;
  urlFoto: string | null;
  larTemporarioId: string | null;
  adotanteId: string | null;
  adotante: AdotanteInfo | null;
  dataAdocao: string | null;
  createdAt: string;
}


export interface NewAnimalProps {
  nome: string;
  especie?: string | null;
  raca?: string | null;
  status?: AnimalStatusValue;
  urlFoto?: string | null;
  adotante?: AdotanteInfo | null;
  dataAdocao?: string | null;
}


export class Animal {
 
  private static readonly STATUSES_PERMITIDOS_NA_CRIACAO: readonly AnimalStatusValue[] = [
    "disponivel",
    "em_tratamento",
    "adotado",
  ];

  private constructor(private props: AnimalProps) {}


  static restore(props: AnimalProps): Animal {
    return new Animal(props);
  }


  static create(input: NewAnimalProps): Omit<AnimalProps, "id" | "createdAt"> {
    const nome = input.nome?.trim();
    if (!nome || nome.length < 2) {
      throw new ValidationError("nome deve ter pelo menos 2 caracteres");
    }

    const statusValue = input.status ?? "disponivel";
    if (!Animal.STATUSES_PERMITIDOS_NA_CRIACAO.includes(statusValue)) {
      throw new ValidationError(
        `Um animal não pode ser cadastrado diretamente com o status "${statusValue}" — ` +
          `o cadastro só aceita "${Animal.STATUSES_PERMITIDOS_NA_CRIACAO.join('" ou "')}"`,
      );
    }

    const especie = input.especie ?? null;
    const raca = input.raca ?? null;
    const urlFoto = input.urlFoto ?? null;
    const adotante = input.adotante ?? null;
    const dataAdocao = input.dataAdocao ?? null;

    if (statusValue === "adotado") {
      Animal.validarDadosDeAdocao({ especie, raca, urlFoto, adotante, dataAdocao });
    } else if (adotante !== null || dataAdocao !== null) {
      throw new ValidationError(
        `Dados do adotante e data de adoção só podem ser informados quando o status é "adotado"`,
      );
    }

    return {
      nome,
      especie,
      raca,
      status: AnimalStatus.from(statusValue),
      urlFoto,
      larTemporarioId: null,
      adotanteId: null,
      adotante,
      dataAdocao,
    };
  }


  private static validarDadosDeAdocao(dados: {
    especie: string | null;
    raca: string | null;
    urlFoto: string | null;
    adotante: AdotanteInfo | null;
    dataAdocao: string | null;
  }): void {
    const { especie, raca, urlFoto, adotante, dataAdocao } = dados;

    if (!especie?.trim()) {
      throw new ValidationError("especie é obrigatória para cadastrar um animal já adotado");
    }
    if (!raca?.trim()) {
      throw new ValidationError("raca é obrigatória para cadastrar um animal já adotado");
    }
    if (!urlFoto?.trim()) {
      throw new ValidationError("urlFoto é obrigatória para cadastrar um animal já adotado");
    }
    if (!adotante) {
      throw new ValidationError("dados do adotante são obrigatórios para cadastrar um animal já adotado");
    }

    const nomeAdotante = adotante.nome?.trim();
    if (!nomeAdotante || nomeAdotante.length < 2) {
      throw new ValidationError("nome do adotante deve ter pelo menos 2 caracteres");
    }

    if (!Number.isInteger(adotante.idade) || adotante.idade < 1 || adotante.idade > 120) {
      throw new ValidationError("idade do adotante deve ser um número inteiro entre 1 e 120");
    }

    if (!/^\d{8}$/.test(adotante.cep ?? "")) {
      throw new ValidationError("cep do adotante deve conter exatamente 8 números");
    }

    if (!adotante.localidade?.trim()) {
      throw new ValidationError("localidade do adotante é obrigatória");
    }

    if (!dataAdocao || isNaN(Date.parse(dataAdocao))) {
      throw new ValidationError("dataAdocao é obrigatória e deve ser uma data válida para um animal adotado");
    }
    if (Date.parse(dataAdocao) > Date.now()) {
      throw new ValidationError("dataAdocao não pode estar no futuro");
    }
  }

  get id(): string {
    return this.props.id;
  }
  get nome(): string {
    return this.props.nome;
  }
  get especie(): string | null {
    return this.props.especie;
  }
  get raca(): string | null {
    return this.props.raca;
  }
  get status(): AnimalStatus {
    return this.props.status;
  }
  get urlFoto(): string | null {
    return this.props.urlFoto;
  }
  get larTemporarioId(): string | null {
    return this.props.larTemporarioId;
  }
  get adotanteId(): string | null {
    return this.props.adotanteId;
  }
  get adotante(): AdotanteInfo | null {
    return this.props.adotante;
  }
  get dataAdocao(): string | null {
    return this.props.dataAdocao;
  }
  get createdAt(): string {
    return this.props.createdAt;
  }


  changeStatus(novoStatus: AnimalStatus): void {
    if (!this.props.status.podeTransicionarPara(novoStatus)) {
      throw new ValidationError(
        `Não é possível mudar o status de "${this.props.status}" para "${novoStatus}"`,
      );
    }


    const estavaAdotado = this.props.status.valor === "adotado";
    this.props.status = novoStatus;

    if (estavaAdotado) {
      this.props.adotante = null;
      this.props.dataAdocao = null;
    }
  }
}
