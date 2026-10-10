import type { PublicAnimal } from "@amemais/shared-types";
import { mapRowToPublicAnimal } from "../public-animal.mapper";
import type { IPublicAnimalRepository, PublicAnimalFilters } from "../public-animal.repository";

/** Animais disponíveis para adoção, do mais novo cadastro para o mais antigo. */
export class ListPublicAnimalsUseCase {
  constructor(private readonly repository: IPublicAnimalRepository) {}

  async execute(filters: PublicAnimalFilters): Promise<PublicAnimal[]> {
    const rows = await this.repository.listAvailable(filters);
    return rows.map(mapRowToPublicAnimal);
  }
}
