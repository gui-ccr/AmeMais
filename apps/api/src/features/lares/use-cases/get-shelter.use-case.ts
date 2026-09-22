import type { IShelterRepository } from "../shelter.repository";
import { toShelterDTO, type ShelterDTO } from "../shelter.dto";

export class GetShelterUseCase {
  constructor(private readonly repository: IShelterRepository) {}

  async execute(id: string): Promise<ShelterDTO> {
    const shelter = await this.repository.findById(id);
    return toShelterDTO(shelter);
  }
}

