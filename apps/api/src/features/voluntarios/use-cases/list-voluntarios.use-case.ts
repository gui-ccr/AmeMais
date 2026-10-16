import { ForbiddenError } from "@/core/errors";
import type { IVoluntarioRepository, ListVoluntariosFiltros } from "../voluntario.repository";
import { toVoluntarioDTO, type VoluntarioDTO } from "../voluntario.dto";

export interface ListVoluntariosResultadoDTO {
  items: VoluntarioDTO[];
  total: number;
}


export class ListVoluntariosUseCase {
  constructor(private readonly repository: IVoluntarioRepository) {}

  async execute(filtros: ListVoluntariosFiltros): Promise<ListVoluntariosResultadoDTO> {
    const temAcesso = await this.repository.temAcessoDeLeitura();
    if (!temAcesso) {
      throw new ForbiddenError();
    }

    const resultado = await this.repository.list(filtros);
    return { items: resultado.items.map(toVoluntarioDTO), total: resultado.total };
  }
}
