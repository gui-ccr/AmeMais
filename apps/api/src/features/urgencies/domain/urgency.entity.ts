import { ValidationError } from "@/core/errors";

/**
 * Estado completo de uma urgência já persistida (tem id e createdAt, que só
 * existem depois que o banco cria o registro).
 */
export interface UrgencyProps {
  id: string;
  titulo: string;
  descricao: string | null;
  metaArrecadacao: number | null;
  valorArrecadado: number;
  isActive: boolean;
  createdAt: string;
}

/**
 * Dados de entrada para cadastrar uma urgência nova, ainda sem id/createdAt.
 */
export interface NewUrgencyProps {
  titulo: string;
  descricao?: string | null;
  metaArrecadacao?: number | null;
  valorArrecadado?: number;
  isActive?: boolean;
}

/**
 * Dados aceitos para atualizar uma urgência existente — todos opcionais,
 * só os campos presentes são alterados.
 */
export interface UpdateUrgencyProps {
  titulo?: string;
  descricao?: string | null;
  metaArrecadacao?: number | null;
  valorArrecadado?: number;
  isActive?: boolean;
}

/**
 * Dados já validados e normalizados por `Urgency.create()`, prontos para
 * persistir. Nomeado explicitamente (em vez de ficar como um `Omit<...>`
 * anônimo repetido em cada camada) para que repository e mapper dependam
 * do mesmo contrato que a fábrica de domínio produz.
 */
export type UrgencyCreationData = Omit<UrgencyProps, "id" | "createdAt">;

/**
 * Entidade de domínio (DDD): tem identidade (`id`) e é dona das regras que
 * garantem que uma Urgency nunca fique num estado inválido (ex.: título vazio,
 * valor arrecadado maior que a meta de arrecadação na criação).
 *
 * O estado (`props`) é privado — a entidade protege suas próprias invariantes,
 * garantindo consistência sem espalhar regras de validação por controllers,
 * repositories ou schemas.
 */
export class Urgency {
  private constructor(private props: UrgencyProps) {}

  /**
   * Reconstrói a entidade a partir de dados já persistidos (chamado pelo
   * mapper ao ler uma linha do banco). Não revalida invariantes de criação
   * porque o dado já passou por elas quando foi criado.
   */
  static restore(props: UrgencyProps): Urgency {
    return new Urgency(props);
  }

  /**
   * Valida as regras de negócio de cadastro e devolve os dados prontos
   * para persistir. Factory (padrão de projeto) que garante que não existe
   * caminho para criar uma Urgency fora das invariantes do domínio —
   * não importa se quem chama é um controller HTTP, um script ou um teste.
   *
   * Regras de negócio centralizadas aqui:
   * 1. Título obrigatório (rejeita ausente, vazio ou somente espaços, mín. 2 caracteres).
   * 2. valorArrecadado não pode ser maior que metaArrecadacao na criação.
   * 3. Valores monetários não podem ser negativos.
   */
  static create(input: NewUrgencyProps): UrgencyCreationData {
    const titulo = input.titulo?.trim();
    if (!titulo) {
      throw new ValidationError("titulo é obrigatório");
    }
    if (titulo.length < 2) {
      throw new ValidationError("titulo deve ter pelo menos 2 caracteres");
    }

    const valorArrecadado = input.valorArrecadado ?? 0;
    if (valorArrecadado < 0) {
      throw new ValidationError("valorArrecadado não pode ser negativo");
    }

    const metaArrecadacao = input.metaArrecadacao ?? null;
    if (metaArrecadacao !== null && metaArrecadacao < 0) {
      throw new ValidationError("metaArrecadacao não pode ser negativa");
    }

    if (metaArrecadacao !== null && valorArrecadado > metaArrecadacao) {
      throw new ValidationError("valorArrecadado não pode ser maior que metaArrecadacao");
    }

    const isActive = input.isActive ?? false;

    return {
      titulo,
      descricao: input.descricao?.trim() || null,
      metaArrecadacao,
      valorArrecadado,
      isActive,
    };
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
  get metaArrecadacao(): number | null {
    return this.props.metaArrecadacao;
  }
  get valorArrecadado(): number {
    return this.props.valorArrecadado;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): string {
    return this.props.createdAt;
  }

  /**
   * Atualiza os campos de uma urgência existente, revalidando as mesmas
   * invariantes de negócio para os campos informados.
   */
  update(input: UpdateUrgencyProps): void {
    if (input.titulo !== undefined) {
      const titulo = input.titulo.trim();
      if (!titulo) {
        throw new ValidationError("titulo é obrigatório");
      }
      if (titulo.length < 2) {
        throw new ValidationError("titulo deve ter pelo menos 2 caracteres");
      }
      this.props.titulo = titulo;
    }

    if (input.descricao !== undefined) {
      this.props.descricao = input.descricao?.trim() || null;
    }

    const novoValor = input.valorArrecadado !== undefined ? input.valorArrecadado : this.props.valorArrecadado;
    const novaMeta = input.metaArrecadacao !== undefined ? input.metaArrecadacao : this.props.metaArrecadacao;

    if (novoValor < 0) {
      throw new ValidationError("valorArrecadado não pode ser negativo");
    }
    if (novaMeta !== null && novaMeta !== undefined && novaMeta < 0) {
      throw new ValidationError("metaArrecadacao não pode ser negativa");
    }
    if (novaMeta !== null && novaMeta !== undefined && novoValor > novaMeta) {
      throw new ValidationError("valorArrecadado não pode ser maior que metaArrecadacao");
    }

    if (input.valorArrecadado !== undefined) {
      this.props.valorArrecadado = novoValor;
    }
    if (input.metaArrecadacao !== undefined) {
      this.props.metaArrecadacao = novaMeta ?? null;
    }
    if (input.isActive !== undefined) {
      this.props.isActive = input.isActive;
    }
  }

  /**
   * Registra um novo valor arrecadado, mantendo a consistência do total acumulado
   * em relação à meta da campanha.
   */
  registrarArrecadacao(valor: number): void {
    if (valor <= 0) {
      throw new ValidationError("valor arrecadado deve ser maior que zero");
    }
    const novoTotal = this.props.valorArrecadado + valor;
    if (this.props.metaArrecadacao !== null && novoTotal > this.props.metaArrecadacao) {
      throw new ValidationError("valorArrecadado não pode ser maior que metaArrecadacao");
    }
    this.props.valorArrecadado = novoTotal;
  }
}
