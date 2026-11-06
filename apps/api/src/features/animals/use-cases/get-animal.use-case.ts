import type { IAnimalRepository } from "../animal.repository";
import { toAnimalDTO, type AnimalDTO } from "../animal.dto";

export class GetAnimalUseCase {
  constructor(private readonly repository: IAnimalRepository) {}

  async execute(id: string): Promise<AnimalDTO> {
    const animal = await this.repository.findById(id);
    const lares = await this.repository.findLaresResumo(animal.larTemporarioId ? [animal.larTemporarioId] : []);
    return toAnimalDTO(animal, animal.larTemporarioId ? (lares.get(animal.larTemporarioId) ?? null) : null);
  }
}
