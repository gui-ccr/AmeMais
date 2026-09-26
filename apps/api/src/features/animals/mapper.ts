import { ValidationError } from "@/core/errors";
import { Adotante } from "./domain/adotante.vo";
import { Animal, type AnimalCreationData } from "./domain/animal.entity";
import { AnimalStatus } from "./domain/animal-status.vo";

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
  adotante_nome: string | null;
  adotante_idade: number | null;
  adotante_cep: string | null;
  adotante_localidade: string | null;
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
    adotante: mapRowToAdotante(row),
    dataAdocao: row.data_adocao,
    createdAt: row.created_at,
  });
}

/**
 * As 4 colunas do adotante andam juntas (CHECK `animais_adotante_completo_check`
 * no banco): ou vêm todas, ou nenhuma. Se vierem só algumas, o registro está
 * corrompido — falha alto e explícito aqui, como já fazemos com o status,
 * em vez de devolver um adotante "meio vazio" ou esconder o problema.
 */
function mapRowToAdotante(row: AnimalRow): Adotante | null {
  const colunas = [row.adotante_nome, row.adotante_idade, row.adotante_cep, row.adotante_localidade];
  const preenchidas = colunas.filter((valor) => valor !== null && valor !== undefined).length;

  if (preenchidas === 0) return null;
  if (preenchidas !== colunas.length) {
    throw new ValidationError(`Animal ${row.id} com dados do adotante incompletos (${preenchidas} de 4 colunas)`);
  }

  return Adotante.from({
    nome: row.adotante_nome!,
    idade: row.adotante_idade!,
    cep: row.adotante_cep!,
    localidade: row.adotante_localidade!,
  });
}

/**
 * Colunas que guardam a adoção, tiradas do estado da entidade. Quando o animal
 * deixa de estar `adotado`, a entidade já zerou tudo — então gravar estas
 * colunas apaga os dados pessoais do adotante junto com a mudança de status.
 */
export function mapAdocaoToRow(animal: Animal) {
  return {
    adotante_id: animal.adotanteId,
    adotante_nome: animal.adotante?.nome ?? null,
    adotante_idade: animal.adotante?.idade ?? null,
    adotante_cep: animal.adotante?.cep ?? null,
    adotante_localidade: animal.adotante?.localidade ?? null,
    data_adocao: animal.dataAdocao,
  };
}

/**
 * Recebe o resultado já validado de `Animal.create()` — não o DTO cru da
 * requisição — para que o nome trimado, o CEP só com dígitos e as demais
 * normalizações da entidade sejam o que realmente vai para o banco.
 */
export function mapCreateDTOToRow(input: AnimalCreationData) {
  return {
    nome: input.nome,
    especie: input.especie,
    raca: input.raca,
    status_adocao: input.status.valor,
    url_foto: input.urlFoto,
    adotante_nome: input.adotante?.nome ?? null,
    adotante_idade: input.adotante?.idade ?? null,
    adotante_cep: input.adotante?.cep ?? null,
    adotante_localidade: input.adotante?.localidade ?? null,
    data_adocao: input.dataAdocao,
  };
}
