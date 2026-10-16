import { ConflictError } from "@/core/errors";
import { Voluntario } from "../domain/voluntario.entity";
import type { IVoluntarioRepository } from "../voluntario.repository";
import { toVoluntarioDTO, type VoluntarioDTO } from "../voluntario.dto";
import type { CreateVoluntarioDTO } from "../schema";

export class CreateVoluntarioUseCase {
  constructor(private readonly repository: IVoluntarioRepository) {}

  async execute(input: CreateVoluntarioDTO): Promise<VoluntarioDTO> {

    const data = Voluntario.create(input);

    
    if (data.email) {
      const duplicado = await this.repository.existsByEmail(data.email);
      if (duplicado) {
        throw new ConflictError("Já existe um voluntário cadastrado com este e-mail.");
      }
    }

    const voluntario = await this.repository.create(data);
    return toVoluntarioDTO(voluntario);
  }
}
