import type { IDoacaoRepository } from "../doacao.repository";
import { toDoacaoDTO, type DoacaoDTO } from "../doacao.dto";

export class GetDoacaoUseCase {
  constructor(private readonly repository: IDoacaoRepository) {}

  async execute(id: string): Promise<DoacaoDTO> {
    return toDoacaoDTO(await this.repository.findById(id));
  }
}
