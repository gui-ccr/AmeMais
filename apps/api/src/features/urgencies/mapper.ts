import { Urgency, type UrgencyCreationData } from "./domain/urgency.entity";
import type { PrioridadeUrgencia, TipoDoacao, UnidadeMeta } from "./domain/urgency-options";
import type { UpdateUrgencyDTO } from "./schema";

/**
 * Formato exato da tabela "urgency_items" no Postgres (snake_case). Fica
 * concentrado aqui — nenhuma outra camada (use case, controller) sabe
 * como o banco nomeia suas colunas.
 */
export interface UrgencyRow {
  id: string;
  titulo: string;
  descricao: string | null;
  meta_arrecadacao: number | null;
  valor_arrecadado: number;
  unidade: UnidadeMeta;
  prioridade: PrioridadeUrgencia;
  tipo: TipoDoacao;
  data_limite: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Reconstrói a entidade de domínio a partir da linha crua do banco de dados.
 * É o único ponto de tradução snake_case -> entidade (camelCase).
 */
export function mapRowToEntity(row: UrgencyRow): Urgency {
  return Urgency.restore({
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao,
    metaArrecadacao: row.meta_arrecadacao !== null ? Number(row.meta_arrecadacao) : null,
    valorArrecadado: Number(row.valor_arrecadado ?? 0),
    unidade: row.unidade,
    prioridade: row.prioridade,
    tipo: row.tipo,
    dataLimite: row.data_limite,
    isActive: row.is_active,
    createdAt: row.created_at,
  });
}

/**
 * Recebe o resultado já validado de `Urgency.create()` — não o DTO crú da
 * requisição — para que o título trimado e os defaults aplicados pela
 * entidade sejam o que realmente vai para o banco.
 */
export function mapCreateDTOToRow(input: UrgencyCreationData) {
  return {
    titulo: input.titulo,
    descricao: input.descricao,
    meta_arrecadacao: input.metaArrecadacao,
    valor_arrecadado: input.valorArrecadado,
    unidade: input.unidade,
    prioridade: input.prioridade,
    tipo: input.tipo,
    data_limite: input.dataLimite,
    is_active: input.isActive,
  };
}

export function mapUpdateDTOToRow(input: UpdateUrgencyDTO) {
  const row: Record<string, unknown> = {};
  if (input.titulo !== undefined) row.titulo = input.titulo;
  if (input.descricao !== undefined) row.descricao = input.descricao ?? null;
  if (input.metaArrecadacao !== undefined) row.meta_arrecadacao = input.metaArrecadacao;
  if (input.valorArrecadado !== undefined) row.valor_arrecadado = input.valorArrecadado;
  if (input.unidade !== undefined) row.unidade = input.unidade;
  if (input.prioridade !== undefined) row.prioridade = input.prioridade;
  if (input.tipo !== undefined) row.tipo = input.tipo;
  if (input.dataLimite !== undefined) row.data_limite = input.dataLimite;
  if (input.isActive !== undefined) row.is_active = input.isActive;
  return row;
}
