import type { IDoacaoRepository } from "../doacao.repository";
import { toDoacaoDTO, type DoacaoDTO } from "../doacao.dto";
import type { UpdateDoacaoDTO } from "../schema";

/** Busca a entidade, deixa ela validar as mudanças e só então persiste. */
export class UpdateDoacaoUseCase {
  constructor(private readonly repository: IDoacaoRepository) {}

  async execute(id: string, input: UpdateDoacaoDTO): Promise<DoacaoDTO> {
    const doacao = await this.repository.findById(id);
    doacao.update(input);

    const atualizada = await this.repository.update(id, input);
    return toDoacaoDTO(atualizada);
  }
}
