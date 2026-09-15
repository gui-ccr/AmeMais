import type { IAnimalRepository } from "../animal.repository";

export class DeleteAnimalUseCase {
  constructor(private readonly repository: IAnimalRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.remove(id);
  }
}
