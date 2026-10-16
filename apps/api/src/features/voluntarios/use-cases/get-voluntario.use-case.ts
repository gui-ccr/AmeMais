import type { IVoluntarioRepository } from "../voluntario.repository";
import { toVoluntarioDetalheDTO, type VoluntarioDetalheDTO } from "../voluntario.dto";


export class GetVoluntarioUseCase {
  constructor(private readonly repository: IVoluntarioRepository) {}

  async execute(id: string): Promise<VoluntarioDetalheDTO> {
    const voluntario = await this.repository.findById(id);
    const larTemporario = await this.repository.findLarVinculado(id);

    return toVoluntarioDetalheDTO(voluntario, larTemporario);
  }
}
