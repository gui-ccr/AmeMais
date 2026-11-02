import { NotFoundError } from "@/core/errors";
import type { IShelterRepository } from "../shelter.repository";
import { toShelterDetailDTO, type ShelterDetailDTO } from "../shelter.dto";

/**
 * Tira um animal do lar (KAN-78): o animal volta para `disponivel`. Se o
 * animal não estiver neste lar, responde 404 em vez de mexer em outro lar.
 */
export class RemoveAnimalFromShelterUseCase {
  constructor(private readonly repository: IShelterRepository) {}

  async execute(larId: string, animalId: string): Promise<ShelterDetailDTO> {
    const shelter = await this.repository.findById(larId);
    const animal = await this.repository.findAnimal(animalId);

    if (animal.larTemporarioId !== larId) {
      throw new NotFoundError("Animal neste lar");
    }

    await this.repository.desvincularAnimal(animalId);

    return toShelterDetailDTO(shelter, await this.repository.listAnimais(larId));
  }
}
