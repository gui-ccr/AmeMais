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
  /** Usuário do sistema que adotou (fluxo antigo). O cadastro pelo admin usa `adotante`. */
  adotanteId: string | null;
  /** Quem adotou, quando o cadastro trouxe os dados da adoção. Só existe com status `adotado`. */
  adotante: Adotante | null;
  dataAdocao: string | null;
  createdAt: string;
}

/**
 * Dados de entrada para cadastrar um animal novo, ainda sem id/createdAt.
 * `status` aqui ainda é a string crua (é o formato de entrada) — vira VO
 * dentro de `Animal.create()`; `adotante` também (vira o VO `Adotante`).
 */
export interface NewAnimalProps {
  nome: string;
  especie?: string | null;
  raca?: string | null;
  status?: AnimalStatusValue;
  urlFoto?: string | null;
  adotante?: AdotanteInput | null;
  dataAdocao?: string | null;
}

/** Dados já validados e normalizados por `Animal.create()`, prontos para persistir. */
export type AnimalCreationData = Omit<AnimalProps, "id" | "createdAt">;

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
  /**
   * Status com os quais um animal pode nascer no sistema — ver create().
   * `adotado` entra porque o admin também registra animais que já foram
   * adotados (cadastro retroativo, com os dados da adoção).
   */
  private static readonly STATUSES_PERMITIDOS_NA_CRIACAO: readonly AnimalStatusValue[] = [
    "disponivel",
    "em_tratamento",
    "adotado",
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
   *
   * Regras centralizadas aqui:
   * 1. nome com pelo menos 2 caracteres; espécie, se informada, da lista fixa.
   * 2. status inicial: disponivel, em_tratamento ou adotado.
   * 3. animal `adotado` exige os dados do adotante e a data da adoção (que não
   *    pode ser futura); qualquer outro status NÃO aceita esses dados — dado
   *    pessoal de adotante só existe enquanto o animal está adotado.
   */
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

  /**
   * Único jeito de mudar o status de um animal. A checagem da transição é
   * responsabilidade do próprio Value Object (`podeTransicionarPara`), que
   * por baixo usa a matriz de transição encapsulada em `animal-status.vo.ts`
   * — a entidade só aciona a regra, não a reimplementa.
   *
   * Se o animal deixa de estar `adotado` (devolução), os dados da adoção são
   * apagados junto: dado pessoal do adotante não pode sobrar num animal que
   * volta a ser exibido no site.
   */
  changeStatus(novoStatus: AnimalStatus): void {
    if (!this.props.status.podeTransicionarPara(novoStatus)) {
      throw new ValidationError(
        `Não é possível mudar o status de "${this.props.status}" para "${novoStatus}"`,
      );
    }
    this.props.status = novoStatus;

    if (novoStatus.valor !== "adotado") {
      this.props.adotante = null;
      this.props.adotanteId = null;
      this.props.dataAdocao = null;
    }
  }
}
