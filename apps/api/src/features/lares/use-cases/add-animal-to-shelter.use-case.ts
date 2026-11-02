import { BusinessRuleError, ConflictError } from "@/core/errors";
import type { IShelterRepository } from "../shelter.repository";
import { toShelterDetailDTO, type ShelterDetailDTO } from "../shelter.dto";

/**
 * Coloca um animal num lar temporário (KAN-78). Recusa quando o lar está
 * inativo ou cheio (regras da entidade), quando o animal já foi adotado ou
 * quando ele já está em algum lar. Devolve o lar atualizado, com a lista de
 * animais, para a tela não precisar buscar de novo.
 */
export class AddAnimalToShelterUseCase {
  constructor(private readonly repository: IShelterRepository) {}

  async execute(larId: string, animalId: string): Promise<ShelterDetailDTO> {
    const shelter = await this.repository.findById(larId);
    const animal = await this.repository.findAnimal(animalId);

    if (animal.larTemporarioId === larId) {
      throw new ConflictError("O animal já está neste lar");
    }
    if (animal.larTemporarioId) {
      throw new ConflictError("O animal já está em outro lar. Tire ele de lá antes.");
    }
    if (animal.status === "adotado") {
      throw new BusinessRuleError("Não é possível colocar em lar temporário um animal já adotado");
    }

    shelter.garantirQuePodeReceberAnimal(await this.repository.contarAnimais(larId));

    await this.repository.vincularAnimal(larId, animalId);

    return toShelterDetailDTO(shelter, await this.repository.listAnimais(larId));
  }
}
