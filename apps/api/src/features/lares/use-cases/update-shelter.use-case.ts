import type { IShelterRepository } from "../shelter.repository";
import { toShelterDTO, type ShelterDTO } from "../shelter.dto";
import type { UpdateShelterDTO } from "../schema";

/**
 * Corrige os dados de um lar (KAN-77). A regra de "capacidade não pode
 * ficar menor que a ocupação" mora na entidade (`atualizarDados`); o use
 * case só busca a ocupação atual e persiste o resultado.
 */
export class UpdateShelterUseCase {
  constructor(private readonly repository: IShelterRepository) {}

  async execute(id: string, dados: UpdateShelterDTO): Promise<ShelterDTO> {
    const shelter = await this.repository.findById(id);
    const ocupacao = dados.capacidade !== undefined ? await this.repository.contarAnimais(id) : 0;

    shelter.atualizarDados(dados, ocupacao);

    const updated = await this.repository.update(shelter);
    return toShelterDTO(updated);
  }
}
