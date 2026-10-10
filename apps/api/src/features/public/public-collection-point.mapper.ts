import type { PublicCollectionPoint } from "@amemais/shared-types";
import type { PublicCollectionPointRow } from "./public-collection-point.repository";

/** Linha do banco -> contrato público. Campo a campo, só o que o contrato lista. */
export function mapRowToPublicCollectionPoint(row: PublicCollectionPointRow): PublicCollectionPoint {
  return {
    id: row.id,
    nome: row.nome,
    endereco: row.endereco,
    horario: row.horario,
  };
}
