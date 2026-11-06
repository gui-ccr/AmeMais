import { Doacao } from "../domain/doacao.entity";
import type { IDoacaoRepository } from "../doacao.repository";
import { toDoacaoDTO, type DoacaoDTO } from "../doacao.dto";
import type { CreateDoacaoDTO } from "../schema";

/**
 * Cadastra a doação. Não soma nada na urgência vinculada (`urgenciaId` é só
 * referência: as unidades podem diferir e editar/apagar a doação exigiria estorno)
 * e não recebe "registrado por": o banco grava o usuário autenticado.
 */
export class CreateDoacaoUseCase {
  constructor(private readonly repository: IDoacaoRepository) {}

  async execute(input: CreateDoacaoDTO): Promise<DoacaoDTO> {
    Doacao.create(input);

    const doacao = await this.repository.create(input);
    return toDoacaoDTO(doacao);
  }
}
