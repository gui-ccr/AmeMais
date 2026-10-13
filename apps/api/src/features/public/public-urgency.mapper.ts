import type { PublicUrgency } from "@amemais/shared-types";
import type { PublicUrgencyRow } from "./public-urgency.repository";

/**
 * Linha do banco -> contrato público (`@amemais/shared-types`). Monta o objeto
 * campo a campo de propósito: só sai o que está listado aqui.
 */
export function mapRowToPublicUrgency(row: PublicUrgencyRow): PublicUrgency {
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao,
    prioridade: row.prioridade,
    unidade: row.unidade,
    // numeric do Postgres pode chegar como string pelo PostgREST
    metaArrecadacao: row.meta_arrecadacao !== null ? Number(row.meta_arrecadacao) : null,
    valorArrecadado: Number(row.valor_arrecadado ?? 0),
    dataLimite: row.data_limite,
  };
}
