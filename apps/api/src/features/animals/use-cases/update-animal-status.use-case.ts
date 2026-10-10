import type { AdocaoInput } from "../domain/animal.entity";
import { AnimalStatus, type AnimalStatusValue } from "../domain/animal-status.vo";
import type { IAnimalRepository } from "../animal.repository";
import { toAnimalDTO, type AnimalDTO } from "../animal.dto";

/** A regra de transição mora no `AnimalStatus`; aqui só orquestra. */
export class UpdateAnimalStatusUseCase {
  constructor(private readonly repository: IAnimalRepository) {}

  async execute(id: string, novoStatusValue: AnimalStatusValue, adocao?: AdocaoInput): Promise<AnimalDTO> {
    const animal = await this.repository.findById(id);
    const novoStatus = AnimalStatus.from(novoStatusValue);

    // Para `adotado`, a entidade exige os dados da adoção (e os valida).
    animal.changeStatus(novoStatus, adocao);

    const updated = await this.repository.updateStatus(animal);
    return toAnimalDTO(updated);
  }
}
