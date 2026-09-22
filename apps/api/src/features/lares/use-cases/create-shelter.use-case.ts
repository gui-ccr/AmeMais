import { Shelter } from "../domain/shelter.entity";
import type { IShelterRepository } from "../shelter.repository";
import { toShelterDTO, type ShelterDTO } from "../shelter.dto";
import type { CreateShelterDTO } from "../schema";

export class CreateShelterUseCase {
  constructor(private readonly repository: IShelterRepository) {}

  async execute(input: CreateShelterDTO): Promise<ShelterDTO> {
    // Valida as invariantes de domínio (ex.: status inicial permitido, regras de negócio)
    // independente do que o schema Zod já validou na borda HTTP.
    Shelter.create(input);

    const shelter = await this.repository.create(input);
    return toShelterDTO(shelter);
  }
}

