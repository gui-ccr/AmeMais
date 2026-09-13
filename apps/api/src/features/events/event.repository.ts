import type { SupabaseClient } from "@supabase/supabase-js";
import { throwOnWriteError } from "@/core/supabase-errors";
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
 *
 * Recebe o client já autenticado como o usuário que fez a requisição (ver
 * lib/supabase.ts, createSupabaseForUser) — não a service role. Quem pode
 * ler/criar/editar/apagar é decidido pela RLS da tabela `events`, não por
 * uma checagem repetida aqui.
 */
export class EventRepository implements IEventRepository {
  constructor(private readonly db: SupabaseClient) {}

  async list(): Promise<Event[]> {
    const { data, error } = await this.db
      .from(TABLE)
      .select(COLUMNS)
      .order("data_evento", { ascending: true });

    if (error) throw new DatabaseError(error);
    return (data ?? []).map(mapRowToEntity);
  }

  async findById(id: string): Promise<Event> {
    const { data, error } = await this.db.from(TABLE).select(COLUMNS).eq("id", id).single();

    if (error || !data) throw new NotFoundError("Evento");
    return mapRowToEntity(data);
  }

  async create(input: CreateEventDTO): Promise<Event> {
    const { data, error } = await this.db
      .from(TABLE)
      .insert(mapCreateDTOToRow(input))
      .select(COLUMNS)
      .single();

    if (error) throwOnWriteError(error);
    if (!data) throw new DatabaseError();
    return mapRowToEntity(data);
  }

  async update(id: string, input: UpdateEventDTO): Promise<Event> {
    const { data, error } = await this.db
      .from(TABLE)
      .update(mapUpdateDTOToRow(input))
      .eq("id", id)
      .select(COLUMNS)
      .single();

    // Sem erro explícito (ex.: 42501) e sem linha: ou o evento não existe,
    // ou a RLS barrou por USING (nível insuficiente) — a Postgrest não
    // distingue os dois casos, e por segurança não damos essa pista pro
    // cliente (ambos viram 404).
    if (error || !data) throw new NotFoundError("Evento");
    return mapRowToEntity(data);
  }

  async remove(id: string): Promise<void> {
    const { data, error } = await this.db.from(TABLE).delete().eq("id", id).select("id");

    throwOnWriteError(error);
    if (!data || data.length === 0) throw new NotFoundError("Evento");
  }
}
