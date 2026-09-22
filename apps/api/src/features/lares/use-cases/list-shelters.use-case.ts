import type { IShelterRepository } from "../shelter.repository";
import { toShelterDTO, type ShelterDTO } from "../shelter.dto";

export class ListSheltersUseCase {
  constructor(private readonly repository: IShelterRepository) {}

  async execute(): Promise<ShelterDTO[]> {
    const shelters = await this.repository.list();
    return shelters.map(toShelterDTO);
  }
}

