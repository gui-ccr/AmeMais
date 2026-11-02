import type { SupabaseClient } from "@supabase/supabase-js";
import { throwOnWriteError } from "@/core/supabase-errors";
import { escaparTermoIlike } from "@/core/postgrest";
import { BusinessRuleError, DatabaseError, ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import { mapRowToEntity, mapCreateDTOToRow, mapEntityDadosToRow } from "./mapper";
import type { Shelter } from "./domain/shelter.entity";
import type { ShelterStatus, ShelterStatusValue } from "./domain/shelter-status.vo";
import type { CreateShelterDTO } from "./schema";

const TABLE = "lares_temporarios";
const COLUMNS =
  "id, nome_responsavel, contato, capacidade, status, endereco_regiao, aceita_gatos, aceita_cachorros, is_active, created_at";
const ANIMAIS_TABLE = "animais";

/** Códigos do Postgres: CHECK/trigger de capacidade e bloqueio de RLS. */
const CHECK_VIOLATION_CODE = "23514";
const RLS_VIOLATION_CODE = "42501";

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

/** Animal morando no lar, como aparece nos detalhes (KAN-79). */
export interface AnimalNoLar {
  id: string;
  nome: string;
  especie: string | null;
  urlFoto: string | null;
}

/** O mínimo do animal para decidir se ele pode entrar/sair de um lar (KAN-78). */
export interface AnimalVinculo {
  id: string;
  status: string;
  larTemporarioId: string | null;
}

/** Animal morando no lar, como aparece nos detalhes (KAN-79). */
export interface AnimalNoLar {
  id: string;
  nome: string;
  especie: string | null;
  urlFoto: string | null;
}

/** O mínimo do animal para decidir se ele pode entrar/sair de um lar (KAN-78). */
export interface AnimalVinculo {
  id: string;
  status: string;
  larTemporarioId: string | null;
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
  update(shelter: Shelter): Promise<Shelter>;
  updateStatus(id: string, status: ShelterStatus | ShelterStatusValue): Promise<Shelter>;
  inativar(id: string): Promise<void>;
  listAnimais(larId: string): Promise<AnimalNoLar[]>;
  contarAnimais(larId: string): Promise<number>;
  findAnimal(animalId: string): Promise<AnimalVinculo>;
  vincularAnimal(larId: string, animalId: string): Promise<void>;
  desvincularAnimal(animalId: string): Promise<void>;
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


  async update(shelter: Shelter): Promise<Shelter> {
    const { data, error } = await this.db
      .from(TABLE)
      .update(mapEntityDadosToRow(shelter))
      .eq("id", shelter.id)
      .select(COLUMNS)
      .single();

    if (error?.code === CHECK_VIOLATION_CODE) throw new ValidationError("capacidade deve ser um número maior que zero");
    if (error?.code === RLS_VIOLATION_CODE) throw new ForbiddenError();
    if (error || !data) throw new NotFoundError("Lar temporário");
    return mapRowToEntity(data);
  }

  /** Grava o status e o `is_active` que acompanha ele (inativo -> false). */
  async updateStatus(id: string, status: ShelterStatus | ShelterStatusValue): Promise<Shelter> {
    const statusValue = typeof status === "string" ? status : status.valor;

    const { data, error } = await this.db
      .from(TABLE)
      .update({ status: statusValue, is_active: statusValue !== "inativo" })
      .eq("id", id)
      .select(COLUMNS)
      .single();

    // Sem erro explícito e sem linha: ou o lar temporário não existe, ou a RLS
    // barrou por USING (nível insuficiente) — não distinguimos os dois por
    // segurança, os dois viram 404.
    if (error || !data) throw new NotFoundError("Lar temporário");
    return mapRowToEntity(data);
  }

  /**
   * Inativa o lar em vez de apagar (KAN-80): o lar some do uso, mas o
   * cadastro e o vínculo histórico dos animais ficam guardados.
   */
  async inativar(id: string): Promise<void> {
    const { data, error } = await this.db
      .from(TABLE)
      .update({ status: "inativo", is_active: false })
      .eq("id", id)
      .select("id");

    throwOnWriteError(error);
    if (!data || data.length === 0) throw new NotFoundError("Lar temporário");
  }

  async listAnimais(larId: string): Promise<AnimalNoLar[]> {
    const { data, error } = await this.db
      .from(ANIMAIS_TABLE)
      .select("id, nome, especie, url_foto")
      .eq("lar_temporario_id", larId)
      .order("nome", { ascending: true });

    if (error) throw new DatabaseError(error);
    return (data ?? []).map((linha) => ({
      id: linha.id as string,
      nome: linha.nome as string,
      especie: (linha.especie as string | null) ?? null,
      urlFoto: (linha.url_foto as string | null) ?? null,
    }));
  }

  async contarAnimais(larId: string): Promise<number> {
    const { count, error } = await this.db
      .from(ANIMAIS_TABLE)
      .select("id", { count: "exact", head: true })
      .eq("lar_temporario_id", larId);

    if (error) throw new DatabaseError(error);
    return count ?? 0;
  }

  async findAnimal(animalId: string): Promise<AnimalVinculo> {
    const { data, error } = await this.db
      .from(ANIMAIS_TABLE)
      .select("id, status_adocao, lar_temporario_id")
      .eq("id", animalId)
      .single();

    if (error || !data) throw new NotFoundError("Animal");
    return {
      id: data.id as string,
      status: data.status_adocao as string,
      larTemporarioId: (data.lar_temporario_id as string | null) ?? null,
    };
  }

  /**
   * Coloca o animal no lar e muda o status dele numa única escrita (as duas
   * colunas na mesma linha), então nunca fica meio feito. O trigger
   * `tr_controla_capacidade_lar` confere a vaga de novo dentro da transação:
   * se dois pedidos disputarem a última vaga, o segundo volta como 422.
   */
  async vincularAnimal(larId: string, animalId: string): Promise<void> {
    const { data, error } = await this.db
      .from(ANIMAIS_TABLE)
      .update({ lar_temporario_id: larId, status_adocao: "em_lar_temporario" })
      .eq("id", animalId)
      .select("id");

    if (error?.code === CHECK_VIOLATION_CODE) {
      throw new BusinessRuleError("O lar está cheio: capacidade já atingida");
    }
    throwOnWriteError(error);
    if (!data || data.length === 0) throw new NotFoundError("Animal");
  }

  /** Tira o animal do lar e devolve ele para `disponivel`. */
  async desvincularAnimal(animalId: string): Promise<void> {
    const { data, error } = await this.db
      .from(ANIMAIS_TABLE)
      .update({ lar_temporario_id: null, status_adocao: "disponivel" })
      .eq("id", animalId)
      .select("id");

    throwOnWriteError(error);
    if (!data || data.length === 0) throw new NotFoundError("Animal");
  }
}
