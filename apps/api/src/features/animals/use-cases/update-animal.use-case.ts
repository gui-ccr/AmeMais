import type { IAnimalRepository } from "../animal.repository";
import { toAnimalDTO, type AnimalDTO } from "../animal.dto";
import type { UpdateAnimalDTO } from "../schema";

/** Edita os dados do animal; a regra de validação mora na entidade. */
export class UpdateAnimalUseCase {
  constructor(private readonly repository: IAnimalRepository) {}

  async execute(id: string, input: UpdateAnimalDTO): Promise<AnimalDTO> {
    const animal = await this.repository.findById(id);
    animal.update(input);

    const atualizado = await this.repository.updateDados(animal);
    return toAnimalDTO(atualizado);
  }
}
