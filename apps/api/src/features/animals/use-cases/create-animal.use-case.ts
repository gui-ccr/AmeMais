import { Animal } from "../domain/animal.entity";
import type { IAnimalRepository } from "../animal.repository";
import { toAnimalDTO, type AnimalDTO } from "../animal.dto";
import type { CreateAnimalDTO } from "../schema";

export class CreateAnimalUseCase {
  constructor(private readonly repository: IAnimalRepository) {}

  async execute(input: CreateAnimalDTO): Promise<AnimalDTO> {
    // Valida as invariantes de domínio (ex.: status inicial permitido)
    // independente do que o schema Zod já validou na borda HTTP.
    Animal.create(input);

    const animal = await this.repository.create(input);
    return toAnimalDTO(animal);
  }
}
