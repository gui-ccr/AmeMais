import { Event } from "./domain/event.entity";
import { EventDate } from "./domain/event-date.vo";
import type { CreateEventDTO, UpdateEventDTO } from "./schema";

/**
 * Formato exato da tabela "events" no Postgres (snake_case). Fica só
 * aqui — nenhuma outra camada (repository, use case, controller) sabe
 * como o banco nomeia suas colunas.
 */
export interface EventRow {
  id: string;
  titulo: string;
  descricao: string | null;
  data_evento: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Reconstrói a entidade de domínio a partir da linha crua do banco. É o
 * único ponto de tradução snake_case -> entidade — nenhuma outra camada
 * conhece o nome das colunas.
 */
export function mapRowToEntity(row: EventRow): Event {
  return Event.restore({
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao,
    dataEvento: row.data_evento ? EventDate.from(row.data_evento) : null,
    isActive: row.is_active,
    createdAt: row.created_at,
  });
}

export function mapCreateDTOToRow(input: CreateEventDTO) {
  return {
    titulo: input.titulo,
    descricao: input.descricao ?? null,
    data_evento: input.dataEvento ?? null,
    is_active: input.isActive,
  };
}

export function mapUpdateDTOToRow(input: UpdateEventDTO) {
  const row: Record<string, unknown> = {};
  if (input.titulo !== undefined) row.titulo = input.titulo;
  if (input.descricao !== undefined) row.descricao = input.descricao ?? null;
  if (input.dataEvento !== undefined) row.data_evento = input.dataEvento ?? null;
  if (input.isActive !== undefined) row.is_active = input.isActive;
  return row;
}
