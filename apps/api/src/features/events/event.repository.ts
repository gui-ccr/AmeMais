import { supabaseAdmin } from "@/lib/supabase";
import { DatabaseError, NotFoundError } from "@/core/errors";
import { mapRowToEntity, mapCreateDTOToRow, mapUpdateDTOToRow } from "./mapper";
import type { Event } from "./domain/event.entity";
import type { CreateEventDTO, UpdateEventDTO } from "./schema";

const TABLE = "events";
const COLUMNS = "id, titulo, descricao, data_evento, is_active, created_at";

/**
 * Contrato que os use cases dependem de (Dependency Inversion): eles não
 * conhecem o Supabase, só esta interface, e trabalham com a entidade de
 * domínio (`Event`) — nunca com a linha crua do banco.
 */
export interface IEventRepository {
  list(): Promise<Event[]>;
  findById(id: string): Promise<Event>;
  create(input: CreateEventDTO): Promise<Event>;
  update(id: string, input: UpdateEventDTO): Promise<Event>;
  remove(id: string): Promise<void>;
}

/**
 * Única camada que fala com o Supabase. Não sabe nada de HTTP, request,
 * headers, cookies ou auth — recebe dados já validados e devolve a
 * entidade interna (via mapper).
 */
export class EventRepository implements IEventRepository {
  async list(): Promise<Event[]> {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select(COLUMNS)
      .order("data_evento", { ascending: true });

    if (error) throw new DatabaseError(error);
    return (data ?? []).map(mapRowToEntity);
  }

  async findById(id: string): Promise<Event> {
    const { data, error } = await supabaseAdmin.from(TABLE).select(COLUMNS).eq("id", id).single();

    if (error || !data) throw new NotFoundError("Evento");
    return mapRowToEntity(data);
  }

  async create(input: CreateEventDTO): Promise<Event> {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert(mapCreateDTOToRow(input))
      .select(COLUMNS)
      .single();

    if (error) throw new DatabaseError(error);
    return mapRowToEntity(data);
  }

  async update(id: string, input: UpdateEventDTO): Promise<Event> {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update(mapUpdateDTOToRow(input))
      .eq("id", id)
      .select(COLUMNS)
      .single();

    if (error || !data) throw new NotFoundError("Evento");
    return mapRowToEntity(data);
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from(TABLE).delete().eq("id", id);
    if (error) throw new DatabaseError(error);
  }
}
