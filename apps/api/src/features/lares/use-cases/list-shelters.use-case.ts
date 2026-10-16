import type { IShelterRepository, ListSheltersFiltros } from "../shelter.repository";
import { toShelterListItemDTO, type ShelterListItemDTO } from "../shelter.dto";

export interface ListSheltersResultadoDTO {
  items: ShelterListItemDTO[];
  total: number;
}

export class ListSheltersUseCase {
  constructor(private readonly repository: IShelterRepository) {}

  async execute(filtros: ListSheltersFiltros): Promise<ListSheltersResultadoDTO> {
    const resultado = await this.repository.list(filtros);

    return {
      items: resultado.items.map(({ shelter, ocupacao, vagas }) => toShelterListItemDTO(shelter, ocupacao, vagas)),
      total: resultado.total,
    };
  }
}
