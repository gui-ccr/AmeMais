import type { SupabaseClient } from "@supabase/supabase-js";
import { DatabaseError } from "@/core/errors";

const TABLE = "pontos_coleta";

/** Lista FIXA de colunas, as mesmas liberadas ao `anon` (migration 20261005160500). */
const COLUMNS = "id, nome, endereco, horario";

/** Teto de itens por resposta (a rota é pública, não pode devolver a tabela inteira). */
const MAX_ITEMS = 50;

export interface PublicCollectionPointRow {
  id: string;
  nome: string;
  endereco: string;
  horario: string | null;
}

export interface IPublicCollectionPointRepository {
  listActive(): Promise<PublicCollectionPointRow[]>;
}

/**
 * Recebe o client ANÔNIMO. A policy "Leitura publica de pontos de coleta
 * ativos" já limita as linhas; o filtro `ativo` aqui é um segundo cinto.
 */
export class PublicCollectionPointRepository implements IPublicCollectionPointRepository {
  constructor(private readonly db: SupabaseClient) {}

  async listActive(): Promise<PublicCollectionPointRow[]> {
    const { data, error } = await this.db
      .from(TABLE)
      .select(COLUMNS)
      .eq("ativo", true)
      .order("nome", { ascending: true })
      .limit(MAX_ITEMS);

    if (error) throw new DatabaseError(error);
    return (data ?? []) as unknown as PublicCollectionPointRow[];
  }
}
