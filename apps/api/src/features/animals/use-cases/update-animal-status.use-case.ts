import type { AdocaoInput } from "../domain/animal.entity";
import { AnimalStatus, type AnimalStatusValue } from "../domain/animal-status.vo";
import type { IAnimalRepository } from "../animal.repository";
import { toAnimalDTO, type AnimalDTO } from "../animal.dto";

/**
 * A regra de transição de status mora no Value Object `AnimalStatus`
 * (acionada via `Animal.changeStatus`), não aqui: o use case só orquestra
 * — recebe a string já validada pelo Zod do controller, converte pro VO,
 * busca a entidade, pede pra ela mudar de estado (que lança
 * `ValidationError` se a transição não é permitida) e persiste o resultado.
 */
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
