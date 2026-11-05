import { ValidationError } from "@/core/errors";

export const CATEGORIAS_DOACAO = ["racao", "medicamento", "higiene", "cobertores", "dinheiro", "outros"] as const;
export type CategoriaDoacao = (typeof CATEGORIAS_DOACAO)[number];

export const UNIDADES_DOACAO = ["kg", "un", "L", "R$"] as const;
export type UnidadeDoacao = (typeof UNIDADES_DOACAO)[number];

/** Dados editáveis de uma doação (o que o formulário envia). */
export interface DadosDaDoacao {
  descricao: string;
  quantidade: number;
  unidade: UnidadeDoacao;
  categoria: CategoriaDoacao;
  localColeta: string;
  /** AAAA-MM-DD. */
  dataEntrada: string;
  urlFoto: string | null;
  urgenciaId: string | null;
  doadorNome: string | null;
  doadorTelefone: string | null;
  doadorCpf: string | null;
}

/** Estado completo de uma doação já persistida (inclui a auditoria, definida pelo banco). */
export interface DoacaoProps extends DadosDaDoacao {
  id: string;
  registradoPor: string;
  createdAt: string;
}

export type AtualizarDoacaoProps = Partial<DadosDaDoacao>;

/** Amanhã (AAAA-MM-DD, UTC): folga de 1 dia para fusos à frente de UTC. */
function limiteDeDataEntrada(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function validar(dados: DadosDaDoacao): void {
  if (dados.descricao.trim().length < 2) throw new ValidationError("descricao deve ter pelo menos 2 caracteres");
  if (!(dados.quantidade > 0)) throw new ValidationError("quantidade deve ser maior que zero");
  if (dados.localColeta.trim().length < 2) throw new ValidationError("localColeta deve ter pelo menos 2 caracteres");
  if (dados.dataEntrada > limiteDeDataEntrada()) {
    throw new ValidationError("dataEntrada não pode ser no futuro");
  }
}

/**
 * Entidade de domínio: dona das invariantes de uma doação. O estado é privado;
 * a única forma de mudar uma doação existente é `update()`, que revalida tudo.
 * `registradoPor` e `createdAt` nunca mudam (auditoria).
 */
export class Doacao {
  private constructor(private props: DoacaoProps) {}

  /** Valida os dados de um cadastro novo (ainda sem id/auditoria). */
  static create(dados: DadosDaDoacao): void {
    validar(dados);
  }

  static restore(props: DoacaoProps): Doacao {
    return new Doacao({ ...props });
  }

  get id() { return this.props.id; }
  get descricao() { return this.props.descricao; }
  get quantidade() { return this.props.quantidade; }
  get unidade() { return this.props.unidade; }
  get categoria() { return this.props.categoria; }
  get localColeta() { return this.props.localColeta; }
  get dataEntrada() { return this.props.dataEntrada; }
  get urlFoto() { return this.props.urlFoto; }
  get urgenciaId() { return this.props.urgenciaId; }
  get doadorNome() { return this.props.doadorNome; }
  get doadorTelefone() { return this.props.doadorTelefone; }
  get doadorCpf() { return this.props.doadorCpf; }
  get registradoPor() { return this.props.registradoPor; }
  get createdAt() { return this.props.createdAt; }

  update(changes: AtualizarDoacaoProps): void {
    const proximo: DoacaoProps = { ...this.props };
    for (const [chave, valor] of Object.entries(changes)) {
      if (valor !== undefined) (proximo as unknown as Record<string, unknown>)[chave] = valor;
    }
    validar(proximo);
    this.props = proximo;
  }
}
