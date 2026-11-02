import type { IVoluntarioRepository } from "../voluntario.repository";
import { toVoluntarioDTO, type VoluntarioDTO } from "../voluntario.dto";
import type { UpdateVoluntarioStatusDTO } from "../schema";

/** Ativa ou inativa um voluntário. Inativar não mexe no lar vinculado. */
export class UpdateVoluntarioStatusUseCase {
  constructor(private readonly repository: IVoluntarioRepository) {}

  async execute(id: string, { status }: UpdateVoluntarioStatusDTO): Promise<VoluntarioDTO> {
    const voluntario = await this.repository.findById(id);
    voluntario.alterarStatus(status);

    const atualizado = await this.repository.updateStatus(id, voluntario.status.valor);
    return toVoluntarioDTO(atualizado);
  }
}
