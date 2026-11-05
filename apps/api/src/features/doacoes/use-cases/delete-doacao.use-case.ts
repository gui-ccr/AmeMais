import type { IDoacaoRepository } from "../doacao.repository";

export class DeleteDoacaoUseCase {
  constructor(private readonly repository: IDoacaoRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.remove(id);
  }
}
