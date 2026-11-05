import type { IAnimalRepository } from "../animal.repository";
import { toAnimalDTO, type AnimalDTO } from "../animal.dto";

export class ListAnimalsUseCase {
  constructor(private readonly repository: IAnimalRepository) {}

  async execute(): Promise<AnimalDTO[]> {
    const animals = await this.repository.list();
    const ids = animals.flatMap((animal) => (animal.larTemporarioId ? [animal.larTemporarioId] : []));
    const lares = await this.repository.findLaresResumo(ids);
    return animals.map((animal) =>
      toAnimalDTO(animal, animal.larTemporarioId ? (lares.get(animal.larTemporarioId) ?? null) : null),
    );
  }
}
