import type { UnidadeMeta } from "@/features/urgencias/types";

export const CATEGORIAS_DOACAO = ["racao", "medicamento", "higiene", "cobertores", "dinheiro", "outros"] as const;
export type CategoriaDoacao = (typeof CATEGORIAS_DOACAO)[number];

/**
 * Doação recebida pela ONG (física ou em dinheiro). Hoje é alimentada por um mock
 * (ver `doacao-service.ts`): a tabela `doacoes` do banco só tem categoria, data de
 * entrada, ponto de coleta e os 3 dados do doador — e a API não tem rota de doações.
 */
export interface Doacao {
  id: string;
  /** O que foi doado, em texto livre. Ex.: "3 sacos de ração filhote". */
  descricao: string;
  quantidade: number;
  unidade: UnidadeMeta;
  categoria: CategoriaDoacao;
  /** Onde a doação foi recolhida. Ex.: "Pet Shop Amigo Fiel". */
  localColeta: string;
  /** Dia em que a doação chegou, no formato AAAA-MM-DD. */
  dataEntrada: string;
  /** URL da foto; null se a doação não tem foto. */
  urlFoto: string | null;
  /** Urgência à qual a doação está vinculada; null para doação avulsa. */
  urgenciaId: string | null;
  /** Dados do doador: todos opcionais. */
  doadorNome: string | null;
  doadorTelefone: string | null;
  doadorCpf: string | null;
  /** Auditoria: nome de quem fez o cadastro. Não muda numa edição. */
  registradoPor: string;
  /** Quando o cadastro foi feito (ISO). */
  createdAt: string;
}

/** O que o formulário envia ao cadastrar. */
export interface NovaDoacaoInput {
  descricao: string;
  quantidade: number;
  unidade: UnidadeMeta;
  categoria: CategoriaDoacao;
  localColeta: string;
  dataEntrada: string;
  urgenciaId: string | null;
  doadorNome: string | null;
  doadorTelefone: string | null;
  doadorCpf: string | null;
  /** Foto escolhida (arquivo), se houver. */
  foto: File | null;
  /** Nome de quem está cadastrando (usuário logado). */
  registradoPor: string;
}

/**
 * O que o formulário envia ao editar: os mesmos campos do cadastro, menos
 * `registradoPor` (a auditoria não muda). Sobre a foto: `undefined` mantém a atual,
 * um arquivo troca, `null` remove.
 */
export type EditarDoacaoInput = Omit<NovaDoacaoInput, "foto" | "registradoPor"> & { foto?: File | null };
