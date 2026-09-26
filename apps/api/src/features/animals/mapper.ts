import { Animal, type AdotanteInfo } from "./domain/animal.entity";
import { AnimalStatus } from "./domain/animal-status.vo";
import { ValidationError } from "@/core/errors";
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
  adotante_nome: string | null;
  adotante_idade: number | null;
  adotante_cep: string | null;
  adotante_localidade: string | null;
  url_foto: string | null;
  data_adocao: string | null;
  created_at: string;
}

/**
 * As 4 colunas do retrato do adotante são gravadas sempre juntas (ver
 * `Animal.create()`/`changeStatus()` — a entidade nunca deixa só parte
 * delas preenchida). Se o banco tiver só algumas preenchidas, é uma
 * inconsistência real de dado (edição manual, migração incompleta etc.) —
 * seguimos o mesmo padrão de `AnimalStatus.from()` abaixo: falha alto com
 * `ValidationError` em vez de inventar um valor pros campos que faltam.
 */
function mapAdotante(row: AnimalRow): AdotanteInfo | null {
  const { adotante_nome, adotante_idade, adotante_cep, adotante_localidade } = row;
  const algumPreenchido =
    adotante_nome !== null || adotante_idade !== null || adotante_cep !== null || adotante_localidade !== null;

  if (!algumPreenchido) return null;

  if (adotante_nome === null || adotante_idade === null || adotante_cep === null || adotante_localidade === null) {
    throw new ValidationError("Dados do adotante incompletos na linha do banco");
  }

  return { nome: adotante_nome, idade: adotante_idade, cep: adotante_cep, localidade: adotante_localidade };
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
    adotante: mapAdotante(row),
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
    adotante_nome: input.adotante?.nome ?? null,
    adotante_idade: input.adotante?.idade ?? null,
    adotante_cep: input.adotante?.cep ?? null,
    adotante_localidade: input.adotante?.localidade ?? null,
    data_adocao: input.dataAdocao ?? null,
  };
}
