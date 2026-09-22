import { Shelter } from "./domain/shelter.entity";
import { ShelterStatus } from "./domain/shelter-status.vo";
import type { CreateShelterDTO } from "./schema";

/**
 * Formato exato da tabela "lares_temporarios" no Postgres (snake_case). Fica só
 * aqui — nenhuma outra camada (repository, use case, controller) sabe
 * como o banco nomeia suas colunas.
 */
export interface ShelterRow {
  id: string;
  nome_responsavel: string;
  contato: string;
  capacidade: number;
  status: string | null;
  endereco_regiao: string;
  is_active: boolean | null;
  created_at: string;
}

/**
 * Reconstrói a entidade de domínio a partir da linha crua do banco. É o
 * único ponto de tradução snake_case -> entidade — nenhuma outra camada
 * conhece o nome das colunas.
 *
 * `ShelterStatus.from(...)` valida o valor vindo do banco: se a coluna
 * tiver um status que não existe mais nas regras do domínio, falha alto
 * e explícito aqui, em vez de deixar um status inválido circular pela
 * aplicação.
 */
export function mapRowToEntity(row: ShelterRow): Shelter {
  return Shelter.restore({
    id: row.id,
    nomeResponsavel: row.nome_responsavel,
    contato: row.contato,
    capacidade: row.capacidade,
    status: ShelterStatus.from(row.status ?? "disponivel"),
    enderecoRegiao: row.endereco_regiao,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
  });
}

export function mapCreateDTOToRow(input: CreateShelterDTO) {
  return {
    nome_responsavel: input.nomeResponsavel,
    contato: input.contato,
    capacidade: input.capacidade,
    status: input.status,
    endereco_regiao: input.enderecoRegiao,
  };
}

