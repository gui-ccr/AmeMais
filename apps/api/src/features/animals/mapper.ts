import { Animal } from "./domain/animal.entity";
import { AnimalStatus } from "./domain/animal-status.vo";
import type { CreateAnimalDTO } from "./schema";

/**
 * Formato exato da tabela "animais" no Postgres (snake_case). Fica só
 * aqui — nenhuma outra camada (repository, use case, controller) sabe
 * como o banco nomeia suas colunas.
 */
export interface AnimalRow {
  id: string;
  nome: string;
  especie: string | null;
  raca: string | null;
  status_adocao: string | null;
  lar_temporario_id: string | null;
  adotante_id: string | null;
  url_foto: string | null;
  data_adocao: string | null;
  created_at: string;
}

/**
 * Reconstrói a entidade de domínio a partir da linha crua do banco. É o
 * único ponto de tradução snake_case -> entidade — nenhuma outra camada
 * conhece o nome das colunas.
 *
 * `AnimalStatus.from(...)` valida o valor vindo do banco: se a coluna
 * tiver um status que não existe mais nas regras do domínio, falha alto
 * e explícito aqui, em vez de deixar um status inválido circular pela
 * aplicação (antes fazia só um cast, sem checar nada).
 */
export function mapRowToEntity(row: AnimalRow): Animal {
  return Animal.restore({
    id: row.id,
    nome: row.nome,
    especie: row.especie,
    raca: row.raca,
    status: AnimalStatus.from(row.status_adocao ?? "disponivel"),
    urlFoto: row.url_foto,
    larTemporarioId: row.lar_temporario_id,
    adotanteId: row.adotante_id,
    dataAdocao: row.data_adocao,
    createdAt: row.created_at,
  });
}

export function mapCreateDTOToRow(input: CreateAnimalDTO) {
  return {
    nome: input.nome,
    especie: input.especie ?? null,
    raca: input.raca ?? null,
    status_adocao: input.status,
    url_foto: input.urlFoto ?? null,
  };
}
