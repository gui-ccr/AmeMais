import type { IAnimalRepository } from "../animal.repository";
import { toAnimalDTO, type AnimalDTO } from "../animal.dto";

export class ListAnimalsUseCase {
  constructor(private readonly repository: IAnimalRepository) {}

  async execute(): Promise<AnimalDTO[]> {
    const animals = await this.repository.list();
    return animals.map(toAnimalDTO);
  }
}
