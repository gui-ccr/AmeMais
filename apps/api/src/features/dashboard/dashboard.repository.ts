import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DatabaseError } from "@/core/errors";
import { ANIMAL_STATUSES, type AnimalStatusValue } from "../animals/domain/animal-status.vo";
import type { DashboardDTO, EventoProximoDTO } from "./dashboard.dto";

/** Slugs de `public.modulos`: o mesmo que o RLS de cada tabela confere. */
export type ModuloDoDashboard = "operacional" | "lares" | "urgencias" | "voluntarios" | "campanhas";

export const LIMITE_EVENTOS_PROXIMOS = 5;

export interface IDashboardRepository {
  temAcesso(modulo: ModuloDoDashboard): Promise<boolean>;
  contarAnimais(): Promise<NonNullable<DashboardDTO["animais"]>>;
  contarLares(): Promise<NonNullable<DashboardDTO["lares"]>>;
  contarUrgencias(): Promise<NonNullable<DashboardDTO["urgencias"]>>;
  contarVoluntarios(): Promise<NonNullable<DashboardDTO["voluntarios"]>>;
  proximosEventos(agora: Date): Promise<NonNullable<DashboardDTO["eventos"]>>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FiltroDeContagem = (query: PostgrestFilterBuilder<any, any, any, any, any, any, any>) => unknown;

/**
 * Só contagens (`head: true`, nenhuma linha trafega), todas pelo client do próprio usuário:
 * o RLS continua sendo a barreira no banco. `temAcesso` existe para o bloco vir `null`
 * em vez de um zero enganoso quando a pessoa não enxerga o módulo.
 */
export class DashboardRepository implements IDashboardRepository {
  constructor(private readonly db: SupabaseClient) {}

  async temAcesso(modulo: ModuloDoDashboard): Promise<boolean> {
    const { data, error } = await this.db.rpc("check_user_access", { modulo_slug: modulo });
    if (error) throw new DatabaseError(error);
    return data === true;
  }

  private async contar(tabela: string, filtrar?: FiltroDeContagem): Promise<number> {
    const base = this.db.from(tabela).select("id", { count: "exact", head: true });
    const { count, error } = (await (filtrar ? filtrar(base) : base)) as { count: number | null; error: unknown };
    if (error) throw new DatabaseError(error);
    return count ?? 0;
  }

  async contarAnimais() {
    const contagens = await Promise.all(
      ANIMAL_STATUSES.map((status) => this.contar("animais", (query) => query.eq("status_adocao", status))),
    );
    const porStatus = Object.fromEntries(ANIMAL_STATUSES.map((status, i) => [status, contagens[i]])) as Record<
      AnimalStatusValue,
      number
    >;
    return { total: contagens.reduce((soma, n) => soma + n, 0), porStatus };
  }

  async contarLares() {
    // Só lares "disponivel" oferecem vaga: ocupado, em avaliação e inativo não recebem animal novo.
    const { data: lares, error } = await this.db.from("lares_temporarios").select("id").eq("status", "disponivel");
    if (error) throw new DatabaseError(error);

    const ids = (lares ?? []).map((lar) => lar.id as string);
    if (ids.length === 0) return { disponiveis: 0, vagasLivres: 0 };

    const { data: ocupacao, error: erroOcupacao } = await this.db
      .from("lares_com_ocupacao")
      .select("vagas")
      .in("id", ids)
      .gt("vagas", 0);
    if (erroOcupacao) throw new DatabaseError(erroOcupacao);

    const vagasLivres = (ocupacao ?? []).reduce((soma, linha) => soma + (linha.vagas as number), 0);
    return { disponiveis: ids.length, vagasLivres };
  }

  async contarUrgencias() {
    const [abertas, urgentes] = await Promise.all([
      this.contar("urgency_items", (query) => query.eq("is_active", true)),
      this.contar("urgency_items", (query) => query.eq("is_active", true).eq("prioridade", "urgente")),
    ]);
    return { abertas, urgentes };
  }

  async contarVoluntarios() {
    const [ativos, total] = await Promise.all([
      this.contar("voluntarios", (query) => query.eq("status", "ativo")),
      this.contar("voluntarios"),
    ]);
    return { ativos, total };
  }

  async proximosEventos(agora: Date) {
    const { data, error, count } = await this.db
      .from("events")
      .select("id, titulo, data_evento", { count: "exact" })
      .eq("is_active", true)
      .gte("data_evento", agora.toISOString())
      .order("data_evento", { ascending: true })
      .limit(LIMITE_EVENTOS_PROXIMOS);
    if (error) throw new DatabaseError(error);

    const proximos: EventoProximoDTO[] = (data ?? []).map((linha) => ({
      id: linha.id as string,
      titulo: linha.titulo as string,
      dataEvento: linha.data_evento as string,
    }));
    return { total: count ?? proximos.length, proximos };
  }
}
