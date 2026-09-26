import { Animal } from "../domain/animal.entity";
import type { IAnimalRepository } from "../animal.repository";
import { toAnimalDTO, type AnimalDTO } from "../animal.dto";
import type { CreateAnimalDTO } from "../schema";

export class CreateAnimalUseCase {
  constructor(private readonly repository: IAnimalRepository) {}

  async execute(input: CreateAnimalDTO): Promise<AnimalDTO> {
    // Valida as invariantes de domínio (ex.: status inicial permitido, dados
    // da adoção) e devolve os dados já normalizados — é esse resultado, não o
    // input cru, que é persistido.
    const data = Animal.create(input);

    const animal = await this.repository.create(data);
    return toAnimalDTO(animal);
  }
}
