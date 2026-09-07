import { supabaseAdmin } from "@/lib/supabase";
import type {
  CreateEventInput,
  UpdateEventInput,
  EventResponse,
} from "./schema";

export const eventRepository = {
  async list(): Promise<EventResponse[]> {
    const { data, error } = await supabaseAdmin
      .from("eventos")
      .select("id, nome, data, local, descricao, created_at")
      .order("data", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      nome: row.nome,
      data: row.data,
      local: row.local,
      descricao: row.descricao,
      created_at: row.created_at ?? undefined,
    }));
  },

  async findById(id: string): Promise<EventResponse | null> {
    const { data, error } = await supabaseAdmin
      .from("eventos")
      .select("id, nome, data, local, descricao, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      nome: data.nome,
      data: data.data,
      local: data.local,
      descricao: data.descricao,
      created_at: data.created_at ?? undefined,
    };
  },

  async create(input: CreateEventInput): Promise<EventResponse> {
    const { data, error } = await supabaseAdmin
      .from("eventos")
      .insert({
        nome: input.nome,
        data: input.data,
        local: input.local,
        descricao: input.descricao,
      })
      .select("id, nome, data, local, descricao, created_at")
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      nome: data.nome,
      data: data.data,
      local: data.local,
      descricao: data.descricao,
      created_at: data.created_at ?? undefined,
    };
  },

  async update(
    id: string,
    input: UpdateEventInput,
  ): Promise<EventResponse | null> {
    const { data, error } = await supabaseAdmin
      .from("eventos")
      .update(input)
      .eq("id", id)
      .select("id, nome, data, local, descricao, created_at")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      nome: data.nome,
      data: data.data,
      local: data.local,
      descricao: data.descricao,
      created_at: data.created_at ?? undefined,
    };
  },

  async delete(id: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from("eventos")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) {
      throw error;
    }

    return (data?.length ?? 0) > 0;
  },
};