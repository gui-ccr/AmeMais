import type { SupabaseClient } from "@supabase/supabase-js";
import { DatabaseError } from "@/core/errors";

const TABLE = "animais";

/**
 * Lista FIXA de colunas, todas liberadas ao `anon` por GRANT (ver migrations
 * 20261005160100 e 20261005160400). Nada de `select("*")` e nada de
 * adotante_*, adotante_id, lar_temporario_id nem data_adocao: nem o banco deixa
 * o anon ler essas, e esta lista garante que o código nem peça.
 */
const COLUMNS = "id, nome, especie, porte, faixa_etaria, idade_texto, descricao, url_foto, created_at";

export interface PublicAnimalRow {
  id: string;
  nome: string;
  /** O banco aceita NULL em `especie`. */
  especie: "Cachorro" | "Gato" | "Outro" | null;
  porte: "P" | "M" | "G";
  faixa_etaria: "filhote" | "adulto" | "idoso";
  idade_texto: string | null;
  descricao: string | null;
  url_foto: string | null;
  created_at: string;
}

export interface PublicAnimalFilters {
  especie?: "Cachorro" | "Gato" | "Outro";
  porte?: "P" | "M" | "G";
  idade?: "filhote" | "adulto" | "idoso";
  limit: number;
  offset: number;
}

export interface IPublicAnimalRepository {
  listAvailable(filters: PublicAnimalFilters): Promise<PublicAnimalRow[]>;
}

/**
 * Recebe o client ANÔNIMO (ver `createSupabaseAnon`). A policy "Leitura publica
 * de animais disponiveis" já limita as linhas; o filtro `status_adocao` aqui é
 * um segundo cinto, não a única proteção.
 */
export class PublicAnimalRepository implements IPublicAnimalRepository {
  constructor(private readonly db: SupabaseClient) {}

  async listAvailable({ especie, porte, idade, limit, offset }: PublicAnimalFilters): Promise<PublicAnimalRow[]> {
    let query = this.db.from(TABLE).select(COLUMNS).eq("status_adocao", "disponivel");

    if (especie) query = query.eq("especie", especie);
    if (porte) query = query.eq("porte", porte);
    if (idade) query = query.eq("faixa_etaria", idade);

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new DatabaseError(error);
    return (data ?? []) as unknown as PublicAnimalRow[];
  }
}
