import { supabaseAdmin } from "@/lib/supabase";
import type { CreateEventInput, EventItem, UpdateEventInput } from "./schema";

/**
 * Tabela no Supabase (padrão: "eventos", com fallback transparente para "events").
 */
let targetTable = process.env.EVENTS_TABLE || "eventos";

function mapRowToEvent(row: Record<string, unknown>): EventItem {
  return {
    id: String(row.id),
    nome: String(row.nome ?? row.titulo ?? ""),
    data: String(row.data ?? row.data_evento ?? row.dataEvento ?? ""),
    local: String(row.local ?? ""),
    descricao: String(row.descricao ?? row.descrição ?? ""),
    createdAt: (row.created_at as string | undefined) ?? (row.createdAt as string | undefined),
  };
}

function getAlternativeTable(table: string): string {
  return table === "eventos" ? "events" : "eventos";
}

export const eventRepository = {
  async list(): Promise<EventItem[]> {
    let { data, error } = await supabaseAdmin
      .from(targetTable)
      .select("*")
      .order("created_at", { ascending: false });

    if (error && (error.code === "42P01" || error.message?.includes("does not exist"))) {
      targetTable = getAlternativeTable(targetTable);
      const retry = await supabaseAdmin
        .from(targetTable)
        .select("*")
        .order("created_at", { ascending: false });
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapRowToEvent);
  },

  async getById(id: string): Promise<EventItem | null> {
    let { data, error } = await supabaseAdmin
      .from(targetTable)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error && (error.code === "42P01" || error.message?.includes("does not exist"))) {
      targetTable = getAlternativeTable(targetTable);
      const retry = await supabaseAdmin
        .from(targetTable)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      throw error;
    }

    return data ? mapRowToEvent(data) : null;
  },

  async create(input: CreateEventInput): Promise<EventItem> {
    const payload = {
      nome: input.nome,
      data: input.data,
      local: input.local,
      descricao: input.descricao,
    };

    let { data, error } = await supabaseAdmin
      .from(targetTable)
      .insert(payload)
      .select("*")
      .single();

    if (error && (error.code === "42P01" || error.message?.includes("does not exist"))) {
      targetTable = getAlternativeTable(targetTable);
      const retry = await supabaseAdmin
        .from(targetTable)
        .insert(payload)
        .select("*")
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      throw error;
    }

    return mapRowToEvent(data);
  },

  async update(id: string, input: UpdateEventInput): Promise<EventItem | null> {
    const payload: Record<string, unknown> = {};
    if (input.nome !== undefined) payload.nome = input.nome;
    if (input.data !== undefined) payload.data = input.data;
    if (input.local !== undefined) payload.local = input.local;
    if (input.descricao !== undefined) payload.descricao = input.descricao;

    let { data, error } = await supabaseAdmin
      .from(targetTable)
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error && (error.code === "42P01" || error.message?.includes("does not exist"))) {
      targetTable = getAlternativeTable(targetTable);
      const retry = await supabaseAdmin
        .from(targetTable)
        .update(payload)
        .eq("id", id)
        .select("*")
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      throw error;
    }

    return data ? mapRowToEvent(data) : null;
  },

  async remove(id: string): Promise<boolean> {
    let { error } = await supabaseAdmin
      .from(targetTable)
      .delete()
      .eq("id", id);

    if (error && (error.code === "42P01" || error.message?.includes("does not exist"))) {
      targetTable = getAlternativeTable(targetTable);
      const retry = await supabaseAdmin
        .from(targetTable)
        .delete()
        .eq("id", id);
      error = retry.error;
    }

    if (error) {
      throw error;
    }

    return true;
  },
};
