import type { SupabaseClient } from "@supabase/supabase-js";
import { throwOnWriteError } from "@/core/supabase-errors";
import { DatabaseError, NotFoundError } from "@/core/errors";
import { mapAdocaoToRow, mapRowToEntity, mapCreateDTOToRow } from "./mapper";
import type { Animal, AnimalCreationData } from "./domain/animal.entity";

const TABLE = "animais";
const COLUMNS =
  "id, nome, especie, raca, status_adocao, lar_temporario_id, adotante_id, url_foto, data_adocao, adotante_nome, adotante_idade, adotante_cep, adotante_localidade, created_at";

/**
 * Contrato que os use cases dependem de (Dependency Inversion): eles não
 * conhecem o Supabase, só esta interface, e trabalham com a entidade de
 * domínio (`Animal`) — nunca com a linha crua do banco. Facilita trocar a
 * implementação (ex.: um repository fake em teste) sem tocar nos use cases.
 */
export interface IAnimalRepository {
  list(): Promise<Animal[]>;
  findById(id: string): Promise<Animal>;
  create(input: AnimalCreationData): Promise<Animal>;
  updateStatus(animal: Animal): Promise<Animal>;
  remove(id: string): Promise<void>;
}

/**
 * Única camada que fala com o Supabase. Não sabe nada de HTTP, request,
 * headers, cookies ou auth — recebe dados já validados e devolve a
 * entidade interna (via mapper).
 *
 * Recebe o client já autenticado como o usuário que fez a requisição (ver
 * lib/supabase.ts, createSupabaseForUser) — não a service role. Quem pode
 * ler/criar/editar/apagar é decidido pela RLS da tabela `animais`, não por
 * uma checagem repetida aqui.
 */
export class AnimalRepository implements IAnimalRepository {
  constructor(private readonly db: SupabaseClient) {}

  async list(): Promise<Animal[]> {
    const { data, error } = await this.db
      .from(TABLE)
      .select(COLUMNS)
      .order("created_at", { ascending: false });

    if (error) throw new DatabaseError(error);
    return (data ?? []).map(mapRowToEntity);
  }

  async findById(id: string): Promise<Animal> {
    const { data, error } = await this.db.from(TABLE).select(COLUMNS).eq("id", id).single();

    if (error || !data) throw new NotFoundError("Animal");
    return mapRowToEntity(data);
  }

  async create(input: AnimalCreationData): Promise<Animal> {
    const { data, error } = await this.db
      .from(TABLE)
      .insert(mapCreateDTOToRow(input))
      .select(COLUMNS)
      .single();

    if (error) throwOnWriteError(error);
    if (!data) throw new DatabaseError();
    return mapRowToEntity(data);
  }

  /**
   * Grava o status E os dados da adoção a partir do estado da entidade, na mesma
   * escrita: ao virar `adotado` guarda adotante/data; ao deixar de ser `adotado`
   * a entidade já zerou tudo (privacidade do adotante; o CHECK da tabela exige).
   */
  async updateStatus(animal: Animal): Promise<Animal> {
    const { data, error } = await this.db
      .from(TABLE)
      .update({ status_adocao: animal.status.valor, ...mapAdocaoToRow(animal) })
      .eq("id", animal.id)
      .select(COLUMNS)
      .single();

    // Sem erro explícito e sem linha: ou o animal não existe, ou a RLS
    // barrou por USING (nível insuficiente) — não distinguimos os dois por
    // segurança, os dois viram 404.
    if (error || !data) throw new NotFoundError("Animal");
    return mapRowToEntity(data);
  }

  async remove(id: string): Promise<void> {
    const { data, error } = await this.db.from(TABLE).delete().eq("id", id).select("id");

    throwOnWriteError(error);
    if (!data || data.length === 0) throw new NotFoundError("Animal");
  }
}
