import type { IEventRepository } from "../event.repository";

export class DeleteEventUseCase {
  constructor(private readonly repository: IEventRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.remove(id);
  }
}
