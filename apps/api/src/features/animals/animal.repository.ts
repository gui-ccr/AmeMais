import { supabaseAdmin } from "@/lib/supabase";
import { DatabaseError, NotFoundError } from "@/core/errors";
import { mapRowToEntity, mapCreateDTOToRow } from "./mapper";
import type { Animal } from "./domain/animal.entity";
import type { AnimalStatus } from "./domain/animal-status.vo";
import type { CreateAnimalDTO } from "./schema";

const TABLE = "animais";
const COLUMNS =
  "id, nome, especie, raca, status_adocao, lar_temporario_id, adotante_id, url_foto, data_adocao, created_at";

/**
 * Contrato que os use cases dependem de (Dependency Inversion): eles não
 * conhecem o Supabase, só esta interface, e trabalham com a entidade de
 * domínio (`Animal`) — nunca com a linha crua do banco. Facilita trocar a
 * implementação (ex.: um repository fake em teste) sem tocar nos use cases.
 */
export interface IAnimalRepository {
  list(): Promise<Animal[]>;
  findById(id: string): Promise<Animal>;
  create(input: CreateAnimalDTO): Promise<Animal>;
  updateStatus(id: string, status: AnimalStatus): Promise<Animal>;
  remove(id: string): Promise<void>;
}

/**
 * Única camada que fala com o Supabase. Não sabe nada de HTTP, request,
 * headers, cookies ou auth — recebe dados já validados e devolve a
 * entidade interna (via mapper).
 */
export class AnimalRepository implements IAnimalRepository {
  async list(): Promise<Animal[]> {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select(COLUMNS)
      .order("created_at", { ascending: false });

    if (error) throw new DatabaseError(error);
    return (data ?? []).map(mapRowToEntity);
  }

  async findById(id: string): Promise<Animal> {
    const { data, error } = await supabaseAdmin.from(TABLE).select(COLUMNS).eq("id", id).single();

    if (error || !data) throw new NotFoundError("Animal");
    return mapRowToEntity(data);
  }

  async create(input: CreateAnimalDTO): Promise<Animal> {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert(mapCreateDTOToRow(input))
      .select(COLUMNS)
      .single();

    if (error) throw new DatabaseError(error);
    return mapRowToEntity(data);
  }

  async updateStatus(id: string, status: AnimalStatus): Promise<Animal> {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update({ status_adocao: status.valor })
      .eq("id", id)
      .select(COLUMNS)
      .single();

    if (error || !data) throw new NotFoundError("Animal");
    return mapRowToEntity(data);
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from(TABLE).delete().eq("id", id);
    if (error) throw new DatabaseError(error);
  }
}
