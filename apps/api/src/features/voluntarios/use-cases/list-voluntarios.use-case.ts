import { ForbiddenError } from "@/core/errors";
import type { IVoluntarioRepository, ListVoluntariosFiltros } from "../voluntario.repository";
import { toVoluntarioDetalheDTO, type VoluntarioDetalheDTO } from "../voluntario.dto";

export interface ListVoluntariosResultadoDTO {
  items: VoluntarioDetalheDTO[];
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
    // Cada item já leva o lar vinculado (uma consulta para a página toda), para a tela
    // não precisar buscar o detalhe de cada voluntário só para mostrar o lar.
    const lares = await this.repository.findLaresVinculados(resultado.items.map((voluntario) => voluntario.id));

    return {
      items: resultado.items.map((voluntario) => toVoluntarioDetalheDTO(voluntario, lares.get(voluntario.id) ?? null)),
      total: resultado.total,
    };
  }
}
