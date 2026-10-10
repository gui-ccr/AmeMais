import type { PublicCollectionPoint } from "@amemais/shared-types";
import type { CollectionPoint } from "../types";

/** Resposta da API pública -> tipo que os componentes de pontos de coleta já usam. */
export function mapCollectionPoint(ponto: PublicCollectionPoint): CollectionPoint {
  return {
    id: ponto.id,
    name: ponto.nome,
    address: ponto.endereco,
    hours: ponto.horario ?? "",
  };
}
