import type { SupabaseClient } from "@supabase/supabase-js";
import { DatabaseError } from "@/core/errors";

const TABLE = "urgency_items";

/**
 * Lista FIXA de colunas que um visitante pode ver. Nada de `select("*")`:
 * se a tabela ganhar uma coluna interna amanhã, ela não sai na rota pública.
 */
const COLUMNS = "id, titulo, descricao, meta_arrecadacao, valor_arrecadado, unidade, prioridade, data_limite, created_at";

/** Teto de itens por resposta (a rota é pública, não pode devolver a tabela inteira). */
const MAX_ITEMS = 50;

export interface PublicUrgencyRow {
  id: string;
  titulo: string;
  descricao: string | null;
  meta_arrecadacao: number | null;
  valor_arrecadado: number;
  unidade: "kg" | "un" | "L" | "R$";
  prioridade: "urgente" | "importante" | "continua";
  data_limite: string | null;
  created_at: string;
}

export interface IPublicUrgencyRepository {
  listActive(): Promise<PublicUrgencyRow[]>;
}

/**
 * Recebe o client ANÔNIMO (ver `createSupabaseAnon`). Quem decide o que o
 * visitante enxerga é a policy "Leitura publica de urgencias ativas"; o filtro
 * `is_active` aqui é um segundo cinto, não a única proteção.
 */
export class PublicUrgencyRepository implements IPublicUrgencyRepository {
  constructor(private readonly db: SupabaseClient) {}

  async listActive(): Promise<PublicUrgencyRow[]> {
    const { data, error } = await this.db.from(TABLE).select(COLUMNS).eq("is_active", true).limit(MAX_ITEMS);

    if (error) throw new DatabaseError(error);
    return (data ?? []) as unknown as PublicUrgencyRow[];
  }
}
