import type { IDoacaoRepository } from "../doacao.repository";
import { toDoacaoDTO, type DoacaoDTO } from "../doacao.dto";

export class ListDoacoesUseCase {
  constructor(private readonly repository: IDoacaoRepository) {}

  async execute(): Promise<DoacaoDTO[]> {
    const doacoes = await this.repository.list();
    return doacoes.map(toDoacaoDTO);
  }
}
