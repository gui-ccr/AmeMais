import type { ExampleItem } from "@amemais/shared-types";
import { supabaseAdmin } from "@/lib/supabase";
import type { CreateExampleInput } from "./schema";

/**
 * Camada de acesso a dados: única camada que fala com o Supabase.
 * Troca a tabela "examples" pela tabela real assim que o domínio for definido.
 */
export const exampleRepository = {
  async list(): Promise<ExampleItem[]> {
    const { data, error } = await supabaseAdmin
      .from("examples")
      .select("id, name, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    }));
  },

  async create(input: CreateExampleInput): Promise<ExampleItem> {
    const { data, error } = await supabaseAdmin
      .from("examples")
      .insert({ name: input.name })
      .select("id, name, created_at")
      .single();

    if (error) throw error;

    return { id: data.id, name: data.name, createdAt: data.created_at };
  },
};
