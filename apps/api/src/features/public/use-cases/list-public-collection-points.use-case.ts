import type { PublicCollectionPoint } from "@amemais/shared-types";
import { mapRowToPublicCollectionPoint } from "../public-collection-point.mapper";
import type { IPublicCollectionPointRepository } from "../public-collection-point.repository";

/** Pontos de coleta ativos, em ordem alfabética. */
export class ListPublicCollectionPointsUseCase {
  constructor(private readonly repository: IPublicCollectionPointRepository) {}

  async execute(): Promise<PublicCollectionPoint[]> {
    const rows = await this.repository.listActive();
    return rows.map(mapRowToPublicCollectionPoint);
  }
}
