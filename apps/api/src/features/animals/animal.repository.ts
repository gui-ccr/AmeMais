import type { SupabaseClient } from "@supabase/supabase-js";
import { throwOnWriteError } from "@/core/supabase-errors";
import { DatabaseError, NotFoundError } from "@/core/errors";
import { mapRowToEntity, mapCreateDTOToRow } from "./mapper";
import type { Animal } from "./domain/animal.entity";
import type { CreateAnimalDTO } from "./schema";

const TABLE = "animais";
const COLUMNS =
  "id, nome, especie, raca, status_adocao, lar_temporario_id, adotante_id, adotante_nome, adotante_idade, adotante_cep, adotante_localidade, url_foto, data_adocao, created_at";

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

  async create(input: CreateAnimalDTO): Promise<Animal> {
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
   * Recebe a entidade (já com `changeStatus()` aplicado) em vez de só
   * `status`, porque a devolução de um animal adotado limpa `adotante` e
   * `dataAdocao` em memória (ver `Animal.changeStatus()`) — sem o objeto
   * inteiro aqui, o repository não tem como saber que precisa gravar esses
   * campos como `null` no banco, e a devolução ficaria "meio feita" (limpa
   * na entidade, mas com o adotante antigo ainda salvo no Postgres).
   */
  async updateStatus(animal: Animal): Promise<Animal> {
    const { data, error } = await this.db
      .from(TABLE)
      .update({
        status_adocao: animal.status.valor,
        adotante_nome: animal.adotante?.nome ?? null,
        adotante_idade: animal.adotante?.idade ?? null,
        adotante_cep: animal.adotante?.cep ?? null,
        adotante_localidade: animal.adotante?.localidade ?? null,
        data_adocao: animal.dataAdocao,
      })
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
