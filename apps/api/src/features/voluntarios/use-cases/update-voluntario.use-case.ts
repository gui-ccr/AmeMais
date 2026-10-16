import { ConflictError } from "@/core/errors";
import type { IVoluntarioRepository } from "../voluntario.repository";
import { toVoluntarioDTO, type VoluntarioDTO } from "../voluntario.dto";
import type { UpdateVoluntarioDTO } from "../schema";


export class UpdateVoluntarioUseCase {
  constructor(private readonly repository: IVoluntarioRepository) {}

  async execute(id: string, input: UpdateVoluntarioDTO): Promise<VoluntarioDTO> {
    const voluntario = await this.repository.findById(id);


    voluntario.update(input);

 
    if (voluntario.email) {
      const duplicado = await this.repository.existsByEmail(voluntario.email, id);
      if (duplicado) {
        throw new ConflictError("Já existe um voluntário cadastrado com este e-mail.");
      }
    }

    const atualizado = await this.repository.update(id, voluntario);
    return toVoluntarioDTO(atualizado);
  }
}
