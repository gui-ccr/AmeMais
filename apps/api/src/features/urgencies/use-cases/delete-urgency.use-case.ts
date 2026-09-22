import type { IUrgencyRepository } from "../urgency.repository";

export class DeleteUrgencyUseCase {
  constructor(private readonly repository: IUrgencyRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.remove(id);
  }
}
