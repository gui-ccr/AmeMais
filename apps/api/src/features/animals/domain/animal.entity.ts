import { ValidationError } from "@/core/errors";
import { Adotante, type AdotanteInput } from "./adotante.vo";
import { ESPECIES } from "./animal-options";
import { AnimalStatus, type AnimalStatusValue } from "./animal-status.vo";

/** Fuso em que a ONG opera: define o que é "hoje" para a data de adoção. */
const FUSO_DA_ONG = "America/Sao_Paulo";

/** Dia de hoje ("AAAA-MM-DD") no fuso da ONG. `en-CA` já formata nesse padrão. */
function hojeNoFusoDaOng(agora: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_DA_ONG }).format(agora);
}

/** Dia que existe no calendário (rejeita 2026-02-30) e não é futuro: ninguém adota amanhã. */
function validarDataAdocao(valor: string): string {
  const existe =
    /^\d{4}-\d{2}-\d{2}$/.test(valor) && new Date(`${valor}T00:00:00Z`).toISOString().slice(0, 10) === valor;
  if (!existe) {
    throw new ValidationError("dataAdocao deve ser uma data válida no formato AAAA-MM-DD");
  }
  if (valor > hojeNoFusoDaOng(new Date())) {
    throw new ValidationError("dataAdocao não pode ser uma data futura");
  }
  return valor;
}

/** Estado de um animal já salvo no banco. */
export interface AnimalProps {
  id: string;
  nome: string;
  especie: string | null;
  raca: string | null;
  status: AnimalStatus;
  urlFoto: string | null;
  larTemporarioId: string | null;
  /** Usuário do sistema que adotou (fluxo antigo). O cadastro pelo admin usa `adotante`. */
  adotanteId: string | null;
  /** Quem adotou, quando o cadastro trouxe os dados da adoção. Só existe com status `adotado`. */
  adotante: Adotante | null;
  dataAdocao: string | null;
  createdAt: string;
}

/** Dados de entrada para cadastrar um animal novo, ainda sem id/createdAt. */
export interface NewAnimalProps {
  nome: string;
  especie?: string | null;
  raca?: string | null;
  status?: AnimalStatusValue;
  urlFoto?: string | null;
  adotante?: AdotanteInput | null;
  dataAdocao?: string | null;
}

/** Dados da adoção, exigidos para mudar o status de um animal para `adotado`. */
export interface AdocaoInput {
  adotante?: AdotanteInput;
  dataAdocao?: string;
}

/** Dados já validados e normalizados por `Animal.create()`, prontos para persistir. */
export type AnimalCreationData = Omit<AnimalProps, "id" | "createdAt">;

/** Entidade Animal: guarda as regras para nunca ficar num estado inválido. */
export class Animal {
  /** Status com os quais um animal pode nascer no sistema — ver create(). */
  private static readonly STATUSES_PERMITIDOS_NA_CRIACAO: readonly AnimalStatusValue[] = [
    "disponivel",
    "em_tratamento",
    "adotado",
  ];

  private constructor(private props: AnimalProps) {}

  /** Reconstrói a entidade a partir de dados já persistidos (chamado só pelo mapper, ao ler uma linha do banco). */
  static restore(props: AnimalProps): Animal {
    return new Animal(props);
  }

  /** Valida as regras de negócio de cadastro e devolve os dados prontos para persistir. */
  static create(input: NewAnimalProps): AnimalCreationData {
    const nome = input.nome?.trim();
    if (!nome || nome.length < 2) {
      throw new ValidationError("nome deve ter pelo menos 2 caracteres");
    }

    if (input.especie != null && !(ESPECIES as readonly string[]).includes(input.especie)) {
      throw new ValidationError(`especie deve ser uma de: ${ESPECIES.join(", ")}`);
    }

    const statusValue = input.status ?? "disponivel";
    if (!Animal.STATUSES_PERMITIDOS_NA_CRIACAO.includes(statusValue)) {
      throw new ValidationError(
        `Um animal não pode ser cadastrado diretamente com o status "${statusValue}" — ` +
          `o cadastro só aceita "${Animal.STATUSES_PERMITIDOS_NA_CRIACAO.join('", "')}"`,
      );
    }

    let adotante: Adotante | null = null;
    let dataAdocao: string | null = null;

    if (statusValue === "adotado") {
      if (!input.especie?.trim()) {
        throw new ValidationError("especie é obrigatória para cadastrar um animal já adotado");
      }
      if (!input.raca?.trim()) {
        throw new ValidationError("raca é obrigatória para cadastrar um animal já adotado");
      }
      if (!input.adotante) {
        throw new ValidationError("adotante é obrigatório para um animal adotado");
      }
      if (!input.dataAdocao) {
        throw new ValidationError("dataAdocao é obrigatória para um animal adotado");
      }
      adotante = Adotante.from(input.adotante);
      dataAdocao = validarDataAdocao(input.dataAdocao);
    } else if (input.adotante || input.dataAdocao) {
      throw new ValidationError('adotante e dataAdocao só podem ser informados para um animal com status "adotado"');
    }

    return {
      nome,
      especie: input.especie ?? null,
      raca: input.raca?.trim() || null,
      status: AnimalStatus.from(statusValue),
      urlFoto: input.urlFoto ?? null,
      larTemporarioId: null,
      adotanteId: null,
      adotante,
      dataAdocao,
    };
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
  get adotante(): Adotante | null {
    return this.props.adotante;
  }
  get dataAdocao(): string | null {
    return this.props.dataAdocao;
  }
  get createdAt(): string {
    return this.props.createdAt;
  }

  /** Único jeito de mudar o status de um animal. */
  changeStatus(novoStatus: AnimalStatus, adocao?: AdocaoInput): void {
    if (!this.props.status.podeTransicionarPara(novoStatus)) {
      throw new ValidationError(
        `Não é possível mudar o status de "${this.props.status}" para "${novoStatus}"`,
      );
    }

    if (novoStatus.valor === "adotado") {
      if (!adocao?.adotante) {
        throw new ValidationError("adotante é obrigatório para marcar o animal como adotado");
      }
      if (!adocao.dataAdocao) {
        throw new ValidationError("dataAdocao é obrigatória para marcar o animal como adotado");
      }
      const adotante = Adotante.from(adocao.adotante);
      const dataAdocao = validarDataAdocao(adocao.dataAdocao);

      this.props.status = novoStatus;
      this.props.adotante = adotante;
      this.props.adotanteId = null;
      this.props.dataAdocao = dataAdocao;
      return;
    }

    if (adocao) {
      throw new ValidationError('adotante e dataAdocao só podem ser informados ao mudar para o status "adotado"');
    }

    this.props.status = novoStatus;
    this.props.adotante = null;
    this.props.adotanteId = null;
    this.props.dataAdocao = null;
  }
}
