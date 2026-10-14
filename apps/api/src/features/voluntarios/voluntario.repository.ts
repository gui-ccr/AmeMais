import type { SupabaseClient } from "@supabase/supabase-js";
import { ConflictError, DatabaseError, NotFoundError } from "@/core/errors";
import { throwOnWriteError } from "@/core/supabase-errors";
import type { LarVinculadoDTO } from "./voluntario.dto";
import { mapCreateDTOToRow, mapRowToEntity, mapUpdateDTOToRow } from "./mapper";
import { normalizarTelefone, type Voluntario, type VoluntarioCreationData } from "./domain/voluntario.entity";
import type { AreaDeAjudaValue } from "./domain/area-de-ajuda.vo";
import type { StatusVoluntarioValue } from "./domain/status-voluntario.vo";
import type { TipoVoluntarioValue } from "./domain/tipo-voluntario.vo";

const TABLE = "voluntarios";
const COLUMNS = "id, nome, email, telefone, tipo, bairro, areas_de_ajuda, status, created_at";


const TABELA_LARES = "lares_temporarios";

/** Código do Postgres para "violação de restrição única" (ex.: o índice de e-mail). */
const UNIQUE_VIOLATION_CODE = "23505";

const MODULO_RBAC = "voluntarios";

export interface ListVoluntariosFiltros {
  busca?: string;
  tipo?: TipoVoluntarioValue;
  status?: StatusVoluntarioValue;
  area?: AreaDeAjudaValue;
  page: number;
  limit: number;
}

export interface ListVoluntariosResultado {
  items: Voluntario[];
  total: number;
}


function escaparTermoBusca(termo: string): string {
  return termo.replace(/[,()]/g, "").replace(/[%_]/g, (caractere) => `\\${caractere}`);
}


function construirFiltroBusca(termoBruto: string): string {
  const termo = escaparTermoBusca(termoBruto);
  const clausulas = [`nome.ilike.%${termo}%`, `email.ilike.%${termo}%`];

  const digitos = normalizarTelefone(termoBruto);
  if (digitos) clausulas.push(`telefone.ilike.%${digitos}%`);

  return clausulas.join(",");
}

export interface IVoluntarioRepository {
  temAcessoDeLeitura(): Promise<boolean>;
  list(filtros: ListVoluntariosFiltros): Promise<ListVoluntariosResultado>;
  findById(id: string): Promise<Voluntario>;

  findLarVinculado(voluntarioId: string): Promise<LarVinculadoDTO | null>;

  existsByEmail(email: string, excludingId?: string): Promise<boolean>;
  create(input: VoluntarioCreationData): Promise<Voluntario>;
  update(id: string, voluntario: Voluntario): Promise<Voluntario>;
}


export class VoluntarioRepository implements IVoluntarioRepository {
  constructor(private readonly db: SupabaseClient) {}

  async temAcessoDeLeitura(): Promise<boolean> {
    const { data, error } = await this.db.rpc("check_user_access", { modulo_slug: MODULO_RBAC });

    if (error) throw new DatabaseError(error);
    return data === true;
  }

  async list(filtros: ListVoluntariosFiltros): Promise<ListVoluntariosResultado> {
    let query = this.db
      .from(TABLE)
      .select(COLUMNS, { count: "exact" })
      .order("nome", { ascending: true })
      .order("id", { ascending: true });

    if (filtros.tipo) query = query.eq("tipo", filtros.tipo);
    if (filtros.status) query = query.eq("status", filtros.status);
    if (filtros.area) query = query.contains("areas_de_ajuda", [filtros.area]);
    if (filtros.busca) query = query.or(construirFiltroBusca(filtros.busca));

    const inicio = (filtros.page - 1) * filtros.limit;
    const fim = inicio + filtros.limit - 1;

    const { data, error, count } = await query.range(inicio, fim);

    if (error) throw new DatabaseError(error);
    return { items: (data ?? []).map(mapRowToEntity), total: count ?? 0 };
  }

  async findById(id: string): Promise<Voluntario> {
    const { data, error } = await this.db.from(TABLE).select(COLUMNS).eq("id", id).single();

    if (error || !data) throw new NotFoundError("Voluntário");
    return mapRowToEntity(data);
  }

  
  async findLarVinculado(voluntarioId: string): Promise<LarVinculadoDTO | null> {
    const { data, error } = await this.db
      .from(TABELA_LARES)
      .select("id, endereco_regiao")
      .eq("voluntario_id", voluntarioId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw new DatabaseError(error);
    if (!data) return null;
    return { id: data.id, enderecoRegiao: data.endereco_regiao };
  }

  async existsByEmail(email: string, excludingId?: string): Promise<boolean> {
    const emailEscapado = email.replace(/[%_]/g, (caractere) => `\\${caractere}`);
    let query = this.db.from(TABLE).select("id").ilike("email", emailEscapado);
    if (excludingId) query = query.neq("id", excludingId);

    const { data, error } = await query.limit(1);

    if (error) throw new DatabaseError(error);
    return (data?.length ?? 0) > 0;
  }

  async create(input: VoluntarioCreationData): Promise<Voluntario> {
    const { data, error } = await this.db
      .from(TABLE)
      .insert(mapCreateDTOToRow(input))
      .select(COLUMNS)
      .single();

    if (error) {
      if (error.code === UNIQUE_VIOLATION_CODE) {
        throw new ConflictError("Já existe um voluntário cadastrado com este e-mail.");
      }
      throwOnWriteError(error);
    }
    if (!data) throw new DatabaseError();
    return mapRowToEntity(data);
  }

  /** Grava só os campos editáveis de `voluntario` (já validados por `Voluntario.update()`) — nunca `status`. */
  async update(id: string, voluntario: Voluntario): Promise<Voluntario> {
    const { data, error } = await this.db
      .from(TABLE)
      .update(mapUpdateDTOToRow(voluntario))
      .eq("id", id)
      .select(COLUMNS)
      .single();

    if (error) {
      if (error.code === UNIQUE_VIOLATION_CODE) {
        throw new ConflictError("Já existe um voluntário cadastrado com este e-mail.");
      }
      throwOnWriteError(error);
    }
    if (!data) throw new NotFoundError("Voluntário");
    return mapRowToEntity(data);
  }
}
