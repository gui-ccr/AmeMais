import type { IShelterRepository } from "../shelter.repository";
import { toShelterDetailDTO, type ShelterDetailDTO } from "../shelter.dto";

/** Detalhes do lar com ocupação, vagas e os animais que moram nele (KAN-79). */
export class GetShelterUseCase {
  constructor(private readonly repository: IShelterRepository) {}

  async execute(id: string): Promise<ShelterDetailDTO> {
    const shelter = await this.repository.findById(id);
    const animais = await this.repository.listAnimais(id);
    return toShelterDetailDTO(shelter, animais);
  }
}
