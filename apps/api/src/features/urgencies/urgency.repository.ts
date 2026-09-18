import type { SupabaseClient } from "@supabase/supabase-js";
import { throwOnWriteError } from "@/core/supabase-errors";
import { DatabaseError, NotFoundError } from "@/core/errors";
import { mapRowToEntity, mapCreateDTOToRow, mapUpdateDTOToRow } from "./mapper";
import type { Urgency, UrgencyCreationData } from "./domain/urgency.entity";
import type { UpdateUrgencyDTO } from "./schema";

const TABLE = "urgency_items";
const COLUMNS = "id, titulo, descricao, meta_arrecadacao, valor_arrecadado, is_active, created_at";

/**
 * Contrato de persistência que os use cases dependem (Dependency Inversion):
 * eles não conhecem o Supabase, só esta interface, e trabalham exclusivamente
 * com a entidade de domínio (`Urgency`) — nunca com a linha crua do banco.
 */
export interface IUrgencyRepository {
  list(): Promise<Urgency[]>;
  findById(id: string): Promise<Urgency>;
  create(input: UrgencyCreationData): Promise<Urgency>;
  update(id: string, input: UpdateUrgencyDTO): Promise<Urgency>;
  updateValorArrecadado(id: string, valorArrecadado: number): Promise<Urgency>;
  remove(id: string): Promise<void>;
}

/**
 * Única camada que conversa com o Supabase para a tabela "urgency_items".
 * Não sabe nada de HTTP, requests, headers ou auth — recebe dados validados
 * e devolve a entidade interna (via mapper).
 *
 * Recebe o client já autenticado como o usuário que fez a requisição
 * (ver lib/supabase.ts, createSupabaseForUser) — não a service role. Quem pode
 * ler/criar/editar/apagar é decidido pela RLS da tabela `urgency_items`.
 */
export class UrgencyRepository implements IUrgencyRepository {
  constructor(private readonly db: SupabaseClient) {}

  async list(): Promise<Urgency[]> {
    const { data, error } = await this.db
      .from(TABLE)
      .select(COLUMNS)
      .order("created_at", { ascending: false });

    if (error) throw new DatabaseError(error);
    return (data ?? []).map(mapRowToEntity);
  }

  async findById(id: string): Promise<Urgency> {
    const { data, error } = await this.db.from(TABLE).select(COLUMNS).eq("id", id).single();

    if (error || !data) throw new NotFoundError("Urgência");
    return mapRowToEntity(data);
  }

  async create(input: UrgencyCreationData): Promise<Urgency> {
    const { data, error } = await this.db
      .from(TABLE)
      .insert(mapCreateDTOToRow(input))
      .select(COLUMNS)
      .single();

    if (error) throwOnWriteError(error);
    if (!data) throw new DatabaseError();
    return mapRowToEntity(data);
  }

  async update(id: string, input: UpdateUrgencyDTO): Promise<Urgency> {
    const { data, error } = await this.db
      .from(TABLE)
      .update(mapUpdateDTOToRow(input))
      .eq("id", id)
      .select(COLUMNS)
      .single();

    if (error || !data) throw new NotFoundError("Urgência");
    return mapRowToEntity(data);
  }

  async updateValorArrecadado(id: string, valorArrecadado: number): Promise<Urgency> {
    const { data, error } = await this.db
      .from(TABLE)
      .update({ valor_arrecadado: valorArrecadado })
      .eq("id", id)
      .select(COLUMNS)
      .single();

    if (error || !data) throw new NotFoundError("Urgência");
    return mapRowToEntity(data);
  }

  async remove(id: string): Promise<void> {
    const { data, error } = await this.db.from(TABLE).delete().eq("id", id).select("id");

    throwOnWriteError(error);
    if (!data || data.length === 0) throw new NotFoundError("Urgência");
  }
}
