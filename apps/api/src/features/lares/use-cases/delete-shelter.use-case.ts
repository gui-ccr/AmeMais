import type { IShelterRepository } from "../shelter.repository";

export class DeleteShelterUseCase {
  constructor(private readonly repository: IShelterRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.remove(id);
  }
}

