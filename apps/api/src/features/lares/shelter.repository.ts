import type { SupabaseClient } from "@supabase/supabase-js";
import { throwOnWriteError } from "@/core/supabase-errors";
import { escaparTermoIlike } from "@/core/postgrest";
import { DatabaseError, NotFoundError } from "@/core/errors";
import { mapRowToEntity, mapCreateDTOToRow } from "./mapper";
import type { Shelter } from "./domain/shelter.entity";
import type { ShelterStatus, ShelterStatusValue } from "./domain/shelter-status.vo";
import type { CreateShelterDTO } from "./schema";

const TABLE = "lares_temporarios";
const COLUMNS =
  "id, nome_responsavel, contato, capacidade, status, endereco_regiao, is_active, created_at";

/**
 * View com a ocupação calculada (migration 20261006170000) — só tem
 * `id, capacidade, ocupacao, vagas`. `nome_responsavel`/`status`/
 * `endereco_regiao` continuam só em `lares_temporarios`; como a view é
 * calculada (GROUP BY), o PostgREST não consegue "embutir" ela numa consulta
 * a `lares_temporarios` (o embed depende de FK real no catálogo do Postgres,
 * que uma view agregada não tem) — por isso as duas são consultadas
 * separadamente e combinadas aqui.
 */
const VIEW_OCUPACAO = "lares_com_ocupacao";

export interface ListSheltersFiltros {
  status?: ShelterStatusValue;
  busca?: string;
  comVagas?: boolean;
  limit: number;
  offset: number;
}

/** `ocupacao`/`vagas` vêm da view — nunca recalculados aqui (ver VIEW_OCUPACAO acima). */
export interface OcupacaoDoLar {
  ocupacao: number;
  vagas: number;
}

export interface ShelterComOcupacao {
  shelter: Shelter;
  ocupacao: number;
  vagas: number;
}

export interface ListSheltersResultado {
  items: ShelterComOcupacao[];
  total: number;
}


function construirFiltroBusca(termoBruto: string): string {
  const termo = escaparTermoIlike(termoBruto);
  return `nome_responsavel.ilike.%${termo}%,endereco_regiao.ilike.%${termo}%`;
}

/**
 * Contrato que os use cases dependem (Dependency Inversion): eles não
 * conhecem o Supabase, só esta interface, e trabalham com a entidade de
 * domínio (`Shelter`) — nunca com a linha crua do banco. Facilita trocar a
 * implementação (ex.: um repository fake em teste) sem tocar nos use cases.
 */
export interface IShelterRepository {
  list(filtros: ListSheltersFiltros): Promise<ListSheltersResultado>;
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

  async list(filtros: ListSheltersFiltros): Promise<ListSheltersResultado> {
    
    let ocupacaoElegiveis: Map<string, OcupacaoDoLar> | null = null;
    if (filtros.comVagas) {
      const { data, error } = await this.db.from(VIEW_OCUPACAO).select("id, ocupacao, vagas").gt("vagas", 0);
      if (error) throw new DatabaseError(error);
      ocupacaoElegiveis = new Map((data ?? []).map((linha) => [linha.id as string, linha as OcupacaoDoLar]));

      if (ocupacaoElegiveis.size === 0) {
        return { items: [], total: 0 };
      }
    }

    let query = this.db.from(TABLE).select(COLUMNS, { count: "exact" });

    if (filtros.status) query = query.eq("status", filtros.status);
    if (filtros.busca) query = query.or(construirFiltroBusca(filtros.busca));
    if (ocupacaoElegiveis) query = query.in("id", [...ocupacaoElegiveis.keys()]);

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(filtros.offset, filtros.offset + filtros.limit - 1);

    if (error) throw new DatabaseError(error);

    const shelters = (data ?? []).map(mapRowToEntity);
    const ocupacaoPorId = ocupacaoElegiveis ?? (await this.buscarOcupacao(shelters.map((s) => s.id)));

    const items: ShelterComOcupacao[] = shelters.map((shelter) => {
      
      const info = ocupacaoPorId.get(shelter.id);
      return { shelter, ocupacao: info?.ocupacao ?? 0, vagas: info?.vagas ?? shelter.capacidade };
    });

    return { items, total: count ?? 0 };
  }

  
  private async buscarOcupacao(ids: string[]): Promise<Map<string, OcupacaoDoLar>> {
    if (ids.length === 0) return new Map();

    const { data, error } = await this.db.from(VIEW_OCUPACAO).select("id, ocupacao, vagas").in("id", ids);
    if (error) throw new DatabaseError(error);
    return new Map((data ?? []).map((linha) => [linha.id as string, linha as OcupacaoDoLar]));
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

