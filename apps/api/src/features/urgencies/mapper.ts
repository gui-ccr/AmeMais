import { Urgency } from "./domain/urgency.entity";
import type { CreateUrgencyDTO, UpdateUrgencyDTO } from "./schema";

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
    isActive: row.is_active,
    createdAt: row.created_at,
  });
}

export function mapCreateDTOToRow(input: CreateUrgencyDTO) {
  return {
    titulo: input.titulo,
    descricao: input.descricao ?? null,
    meta_arrecadacao: input.metaArrecadacao ?? null,
    valor_arrecadado: input.valorArrecadado ?? 0,
    is_active: input.isActive,
  };
}

export function mapUpdateDTOToRow(input: UpdateUrgencyDTO) {
  const row: Record<string, unknown> = {};
  if (input.titulo !== undefined) row.titulo = input.titulo;
  if (input.descricao !== undefined) row.descricao = input.descricao ?? null;
  if (input.metaArrecadacao !== undefined) row.meta_arrecadacao = input.metaArrecadacao;
  if (input.valorArrecadado !== undefined) row.valor_arrecadado = input.valorArrecadado;
  if (input.isActive !== undefined) row.is_active = input.isActive;
  return row;
}
