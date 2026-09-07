import { ValidationError } from "@/core/errors";
import { AnimalStatus, type AnimalStatusValue } from "./animal-status.vo";

/**
 * Estado completo de um animal já persistido (tem id e createdAt, que só
 * existem depois que o banco cria o registro). `status` é o Value Object
 * `AnimalStatus`, não a string crua — ver animal-status.vo.ts.
 */
export interface AnimalProps {
  id: string;
  nome: string;
  especie: string | null;
  raca: string | null;
  status: AnimalStatus;
  urlFoto: string | null;
  larTemporarioId: string | null;
  adotanteId: string | null;
  dataAdocao: string | null;
  createdAt: string;
}

/**
 * Dados de entrada para cadastrar um animal novo, ainda sem id/createdAt.
 * `status` aqui ainda é a string crua (é o formato de entrada) — vira VO
 * dentro de `Animal.create()`.
 */
export interface NewAnimalProps {
  nome: string;
  especie?: string | null;
  raca?: string | null;
  status?: AnimalStatusValue;
  urlFoto?: string | null;
}

/**
 * Entidade de domínio (DDD): tem identidade (`id`) e é dona das regras que
 * garantem que um Animal nunca fique num estado inválido.
 *
 * O estado (`props`) é privado — ninguém fora da entidade consegue, por
 * exemplo, trocar o `status` direto sem passar pela matriz de transição.
 * É a diferença entre uma entidade "rica" e um DTO anêmico: aqui o
 * comportamento (`changeStatus`) mora junto do dado que ele protege.
 */
export class Animal {
  /** Status com os quais um animal pode nascer no sistema — ver create(). */
  private static readonly STATUSES_PERMITIDOS_NA_CRIACAO: readonly AnimalStatusValue[] = [
    "disponivel",
    "em_tratamento",
  ];

  private constructor(private props: AnimalProps) {}

  /**
   * Reconstrói a entidade a partir de dados já persistidos (chamado só
   * pelo mapper, ao ler uma linha do banco). Não revalida invariantes de
   * criação porque o dado já passou por elas quando foi criado.
   */
  static restore(props: AnimalProps): Animal {
    return new Animal(props);
  }

  /**
   * Valida as regras de negócio de cadastro e devolve os dados prontos
   * para persistir. É uma Factory (padrão de projeto) que garante que não
   * existe caminho para criar um Animal fora das invariantes do domínio —
   * não importa se quem chama é um controller HTTP, um script ou um teste.
   */
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

    return {
      nome,
      especie: input.especie ?? null,
      raca: input.raca ?? null,
      status: AnimalStatus.from(statusValue),
      urlFoto: input.urlFoto ?? null,
      larTemporarioId: null,
      adotanteId: null,
      dataAdocao: null,
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
  get dataAdocao(): string | null {
    return this.props.dataAdocao;
  }
  get createdAt(): string {
    return this.props.createdAt;
  }

  /**
   * Único jeito de mudar o status de um animal. A checagem da transição é
   * responsabilidade do próprio Value Object (`podeTransicionarPara`), que
   * por baixo usa a matriz de transição encapsulada em `animal-status.vo.ts`
   * — a entidade só aciona a regra, não a reimplementa.
   */
  changeStatus(novoStatus: AnimalStatus): void {
    if (!this.props.status.podeTransicionarPara(novoStatus)) {
      throw new ValidationError(
        `Não é possível mudar o status de "${this.props.status}" para "${novoStatus}"`,
      );
    }
    this.props.status = novoStatus;
  }
}
