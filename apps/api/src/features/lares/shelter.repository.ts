import type { SupabaseClient } from "@supabase/supabase-js";
import { throwOnWriteError } from "@/core/supabase-errors";
import { DatabaseError, NotFoundError } from "@/core/errors";
import { mapRowToEntity, mapCreateDTOToRow } from "./mapper";
import type { Shelter } from "./domain/shelter.entity";
import type { ShelterStatus, ShelterStatusValue } from "./domain/shelter-status.vo";
import type { CreateShelterDTO } from "./schema";

const TABLE = "lares_temporarios";
const COLUMNS =
  "id, nome_responsavel, contato, capacidade, status, endereco_regiao, is_active, created_at";

/**
 * Contrato que os use cases dependem (Dependency Inversion): eles não
 * conhecem o Supabase, só esta interface, e trabalham com a entidade de
 * domínio (`Shelter`) — nunca com a linha crua do banco. Facilita trocar a
 * implementação (ex.: um repository fake em teste) sem tocar nos use cases.
 */
export interface IShelterRepository {
  list(): Promise<Shelter[]>;
  findById(id: string): Promise<Shelter>;
  create(input: CreateShelterDTO): Promise<Shelter>;
  updateStatus(id: string, status: ShelterStatus | ShelterStatusValue): Promise<Shelter>;
  remove(id: string): Promise<void>;
}

/**
 * Única camada que fala com o Supabase. Não sabe nada de HTTP, request,
 * headers, cookies ou auth — recebe dados já validados e devolve a
 * entidade interna (via mapper).
 *
 * Recebe o client já autenticado como o usuário que fez a requisição (ver
 * lib/supabase.ts, createSupabaseForUser) — não a service role. Quem pode
 * ler/criar/editar/apagar é decidido pela RLS da tabela `lares_temporarios`, não por
 * uma checagem repetida aqui.
 */
export class ShelterRepository implements IShelterRepository {
  constructor(private readonly db: SupabaseClient) {}

  async list(): Promise<Shelter[]> {
    const { data, error } = await this.db
      .from(TABLE)
      .select(COLUMNS)
      .order("created_at", { ascending: false });

    if (error) throw new DatabaseError(error);
    return (data ?? []).map(mapRowToEntity);
  }

  async findById(id: string): Promise<Shelter> {
    const { data, error } = await this.db.from(TABLE).select(COLUMNS).eq("id", id).single();

    if (error || !data) throw new NotFoundError("Lar temporário");
    return mapRowToEntity(data);
  }

  async create(input: CreateShelterDTO): Promise<Shelter> {
    const { data, error } = await this.db
      .from(TABLE)
      .insert(mapCreateDTOToRow(input))
      .select(COLUMNS)
      .single();

    if (error) throwOnWriteError(error);
    if (!data) throw new DatabaseError();
    return mapRowToEntity(data);
  }

  async updateStatus(id: string, status: ShelterStatus | ShelterStatusValue): Promise<Shelter> {
    const statusValue = typeof status === "string" ? status : status.valor;

    const { data, error } = await this.db
      .from(TABLE)
      .update({ status: statusValue })
      .eq("id", id)
      .select(COLUMNS)
      .single();

    // Sem erro explícito e sem linha: ou o lar temporário não existe, ou a RLS
    // barrou por USING (nível insuficiente) — não distinguimos os dois por
    // segurança, os dois viram 404.
    if (error || !data) throw new NotFoundError("Lar temporário");
    return mapRowToEntity(data);
  }

  async remove(id: string): Promise<void> {
    const { data, error } = await this.db.from(TABLE).delete().eq("id", id).select("id");

    throwOnWriteError(error);
    if (!data || data.length === 0) throw new NotFoundError("Lar temporário");
  }
}

