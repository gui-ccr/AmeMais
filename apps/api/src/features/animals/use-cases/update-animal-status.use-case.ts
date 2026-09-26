import { AnimalStatus, type AnimalStatusValue } from "../domain/animal-status.vo";
import type { IAnimalRepository } from "../animal.repository";
import { toAnimalDTO, type AnimalDTO } from "../animal.dto";

export class UpdateAnimalStatusUseCase {
  constructor(private readonly repository: IAnimalRepository) {}

  async execute(id: string, novoStatusValue: AnimalStatusValue): Promise<AnimalDTO> {
    const animal = await this.repository.findById(id);
    const novoStatus = AnimalStatus.from(novoStatusValue);

    animal.changeStatus(novoStatus);

    const updated = await this.repository.updateStatus(animal);
    return toAnimalDTO(updated);
  }
}
