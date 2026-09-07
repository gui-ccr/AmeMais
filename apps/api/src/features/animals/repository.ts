import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { headers as getNextHeaders, cookies as getNextCookies } from "next/headers";
import { NextRequest } from "next/server";
import type { AnimalItem, CreateAnimalInput, UpdateAnimalInput } from "./schema";

/**
 * Cria ou retorna o cliente Supabase instanciado com os cookies e headers da requisição,
 * garantindo que as políticas de RLS sejam respeitadas no banco de dados.
 */
export async function getSupabaseClientForRequest(
  requestOrHeaders?: NextRequest | Headers | { headers?: Headers }
): Promise<SupabaseClient> {
  let authHeader: string | null = null;
  let cookieHeader: string | null = null;

  if (requestOrHeaders && "headers" in requestOrHeaders && requestOrHeaders.headers) {
    authHeader = requestOrHeaders.headers.get("authorization");
    cookieHeader = requestOrHeaders.headers.get("cookie");
  } else if (requestOrHeaders instanceof Headers) {
    authHeader = requestOrHeaders.get("authorization");
    cookieHeader = requestOrHeaders.get("cookie");
  } else {
    try {
      const h = await getNextHeaders();
      authHeader = h.get("authorization");
    } catch {
      // Fora de contexto de request Next.js (ex: em testes)
    }
    try {
      const c = await getNextCookies();
      cookieHeader = c.toString();
    } catch {
      // Fora de contexto de cookies
    }
  }

  const forwardHeaders: Record<string, string> = {};
  if (authHeader) {
    forwardHeaders["Authorization"] = authHeader;
  }
  if (cookieHeader) {
    forwardHeaders["Cookie"] = cookieHeader;
  }

  const supabaseUrl = process.env.SUPABASE_URL || "https://fake-supabase-url.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "fake-key";

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: forwardHeaders,
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function mapRowToAnimal(row: Record<string, unknown>): AnimalItem {
  return {
    id: String(row.id),
    nome: String(row.nome ?? ""),
    especie: (row.especie as string | null) ?? null,
    raca: (row.raca as string | null) ?? null,
    status_adocao: String(row.status_adocao ?? "Disponível"),
    statusAdocao: String(row.status_adocao ?? "Disponível"),
    lar_temporario_id: (row.lar_temporario_id as string | null) ?? null,
    larTemporarioId: (row.lar_temporario_id as string | null) ?? null,
    adotante_id: (row.adotante_id as string | null) ?? null,
    adotanteId: (row.adotante_id as string | null) ?? null,
    url_foto: (row.url_foto as string | null) ?? null,
    urlFoto: (row.url_foto as string | null) ?? null,
    data_adocao: (row.data_adocao as string | null) ?? null,
    dataAdocao: (row.data_adocao as string | null) ?? null,
    created_at: (row.created_at as string | undefined) ?? (row.createdAt as string | undefined),
    createdAt: (row.created_at as string | undefined) ?? (row.createdAt as string | undefined),
  };
}

export interface AnimalRepositoryFilters {
  status?: string;
}

/**
 * Camada de acesso a dados para Animais.
 * Instancia o Supabase Client com os cookies/headers da requisição para respeitar o RLS.
 */
export const animalRepository = {
  async list(filters?: AnimalRepositoryFilters, client?: SupabaseClient): Promise<AnimalItem[]> {
    const supabase = client ?? (await getSupabaseClientForRequest());

    let query = supabase.from("animais").select("*").order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status_adocao", filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map(mapRowToAnimal);
  },

  async getById(id: string, client?: SupabaseClient): Promise<AnimalItem | null> {
    const supabase = client ?? (await getSupabaseClientForRequest());

    const { data, error } = await supabase
      .from("animais")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapRowToAnimal(data) : null;
  },

  async create(input: CreateAnimalInput, client?: SupabaseClient): Promise<AnimalItem> {
    const supabase = client ?? (await getSupabaseClientForRequest());

    const payload = {
      nome: input.nome,
      especie: input.especie ?? null,
      raca: input.raca ?? null,
      status_adocao: input.status_adocao ?? "Disponível",
      lar_temporario_id: input.lar_temporario_id ?? null,
      adotante_id: input.adotante_id ?? null,
      url_foto: input.url_foto ?? null,
      data_adocao: input.data_adocao ?? null,
    };

    const { data, error } = await supabase
      .from("animais")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    return mapRowToAnimal(data);
  },

  async update(id: string, input: UpdateAnimalInput, client?: SupabaseClient): Promise<AnimalItem | null> {
    const supabase = client ?? (await getSupabaseClientForRequest());

    const payload: Record<string, unknown> = {};
    if (input.nome !== undefined) payload.nome = input.nome;
    if (input.especie !== undefined) payload.especie = input.especie;
    if (input.raca !== undefined) payload.raca = input.raca;
    if (input.status_adocao !== undefined) payload.status_adocao = input.status_adocao;
    if (input.lar_temporario_id !== undefined) payload.lar_temporario_id = input.lar_temporario_id;
    if (input.adotante_id !== undefined) payload.adotante_id = input.adotante_id;
    if (input.url_foto !== undefined) payload.url_foto = input.url_foto;
    if (input.data_adocao !== undefined) payload.data_adocao = input.data_adocao;

    const { data, error } = await supabase
      .from("animais")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ? mapRowToAnimal(data) : null;
  },

  async remove(id: string, client?: SupabaseClient): Promise<boolean> {
    const supabase = client ?? (await getSupabaseClientForRequest());

    const { error } = await supabase
      .from("animais")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },
};

export function createAnimalRepository(client: SupabaseClient) {
  return {
    list: (filters?: AnimalRepositoryFilters) => animalRepository.list(filters, client),
    getById: (id: string) => animalRepository.getById(id, client),
    create: (input: CreateAnimalInput) => animalRepository.create(input, client),
    update: (id: string, input: UpdateAnimalInput) => animalRepository.update(id, input, client),
    remove: (id: string) => animalRepository.remove(id, client),
  };
}

