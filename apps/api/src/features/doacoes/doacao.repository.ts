import type { SupabaseClient } from "@supabase/supabase-js";
import { throwOnWriteError } from "@/core/supabase-errors";
import { DatabaseError, NotFoundError } from "@/core/errors";
import { mapRowToEntity, mapCreateDTOToRow, mapUpdateDTOToRow } from "./mapper";
import type { Doacao } from "./domain/doacao.entity";
import type { CreateDoacaoDTO, UpdateDoacaoDTO } from "./schema";

const TABLE = "doacoes";
const COLUMNS =
  "id, descricao, quantidade, unidade, categoria, local_coleta, data_entrada, foto_url, urgencia_id, nome_doador, telefone_doador, cpf_doador, registrado_por_nome, created_at";

/** Contrato dos use cases (Dependency Inversion): trabalham com a entidade, nunca com a linha crua. */
export interface IDoacaoRepository {
  list(): Promise<Doacao[]>;
  findById(id: string): Promise<Doacao>;
  create(input: CreateDoacaoDTO): Promise<Doacao>;
  update(id: string, input: UpdateDoacaoDTO): Promise<Doacao>;
  remove(id: string): Promise<void>;
}

/**
 * Única camada que fala com o Supabase, autenticada como o usuário (ver
 * lib/supabase.ts): a RLS de `doacoes` (módulo 'doacoes') decide quem lê e quem
 * escreve. `registrado_por_*` é preenchido pela trigger do banco.
 */
export class DoacaoRepository implements IDoacaoRepository {
  constructor(private readonly db: SupabaseClient) {}

  /** Mais recentes primeiro: pela data de entrada e, no empate, pela hora do cadastro. */
  async list(): Promise<Doacao[]> {
    const { data, error } = await this.db
      .from(TABLE)
      .select(COLUMNS)
      .order("data_entrada", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw new DatabaseError(error);
    return (data ?? []).map(mapRowToEntity);
  }

  async findById(id: string): Promise<Doacao> {
    const { data, error } = await this.db.from(TABLE).select(COLUMNS).eq("id", id).maybeSingle();

    if (error) throw new DatabaseError(error);
    if (!data) throw new NotFoundError("Doação");
    return mapRowToEntity(data);
  }

  async create(input: CreateDoacaoDTO): Promise<Doacao> {
    const { data, error } = await this.db.from(TABLE).insert(mapCreateDTOToRow(input)).select(COLUMNS).single();

    if (error) throwOnWriteError(error);
    if (!data) throw new DatabaseError();
    return mapRowToEntity(data);
  }

  async update(id: string, input: UpdateDoacaoDTO): Promise<Doacao> {
    const { data, error } = await this.db
      .from(TABLE)
      .update(mapUpdateDTOToRow(input))
      .eq("id", id)
      .select(COLUMNS)
      .maybeSingle();

    throwOnWriteError(error);
    if (!data) throw new NotFoundError("Doação");
    return mapRowToEntity(data);
  }

  async remove(id: string): Promise<void> {
    const { data, error } = await this.db.from(TABLE).delete().eq("id", id).select("id");

    throwOnWriteError(error);
    if (!data || data.length === 0) throw new NotFoundError("Doação");
  }
}
