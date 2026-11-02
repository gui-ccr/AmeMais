import { ValidationError } from "@/core/errors";
import { Adotante } from "./domain/adotante.vo";
import { Animal, type AnimalCreationData } from "./domain/animal.entity";
import type { FaixaEtaria, Porte } from "./domain/animal-options";
import { AnimalStatus } from "./domain/animal-status.vo";

/** Formato exato da tabela "animais" no Postgres (snake_case). */
export interface AnimalRow {
  id: string;
  nome: string;
  especie: string | null;
  raca: string | null;
  status_adocao: string | null;
  porte: string;
  faixa_etaria: string;
  idade_texto: string | null;
  descricao: string | null;
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

/** Reconstrói a entidade de domínio a partir da linha crua do banco. */
export function mapRowToEntity(row: AnimalRow): Animal {
  return Animal.restore({
    id: row.id,
    nome: row.nome,
    especie: row.especie,
    raca: row.raca,
    status: AnimalStatus.from(row.status_adocao ?? "disponivel"),
    porte: row.porte as Porte,
    faixaEtaria: row.faixa_etaria as FaixaEtaria,
    idadeTexto: row.idade_texto,
    descricao: row.descricao,
    urlFoto: row.url_foto,
    larTemporarioId: row.lar_temporario_id,
    adotanteId: row.adotante_id,
    adotante: mapRowToAdotante(row),
    dataAdocao: row.data_adocao,
    createdAt: row.created_at,
  });
}

/** Os 4 campos do adotante vêm juntos; se vierem pela metade, falha. */
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

/** Colunas que guardam a adoção, tiradas do estado da entidade. */
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

/** Recebe os dados já validados por `Animal.create()`. */
export function mapCreateDTOToRow(input: AnimalCreationData) {
  return {
    nome: input.nome,
    especie: input.especie,
    raca: input.raca,
    status_adocao: input.status.valor,
    porte: input.porte,
    faixa_etaria: input.faixaEtaria,
    idade_texto: input.idadeTexto,
    descricao: input.descricao,
    url_foto: input.urlFoto,
    adotante_nome: input.adotante?.nome ?? null,
    adotante_idade: input.adotante?.idade ?? null,
    adotante_cep: input.adotante?.cep ?? null,
    adotante_localidade: input.adotante?.localidade ?? null,
    data_adocao: input.dataAdocao,
  };
}

/** Colunas dos dados editáveis (PUT), tiradas do estado da entidade. */
export function mapDadosToRow(animal: Animal) {
  return {
    nome: animal.nome,
    especie: animal.especie,
    raca: animal.raca,
    porte: animal.porte,
    faixa_etaria: animal.faixaEtaria,
    idade_texto: animal.idadeTexto,
    descricao: animal.descricao,
  };
}
