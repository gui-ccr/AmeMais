import { ShelterStatus, type ShelterStatusValue } from "../domain/shelter-status.vo";
import type { IShelterRepository } from "../shelter.repository";
import { toShelterDTO, type ShelterDTO } from "../shelter.dto";

/**
 * A regra de transição de status mora no Value Object `ShelterStatus`
 * (acionada via `Shelter.changeStatus`), não aqui: o use case só orquestra
 * — recebe o valor validado pelo Zod no controller, converte pro VO,
 * busca a entidade, pede pra ela mudar de estado (que lança
 * `ValidationError` se a transição não é permitida) e persiste o resultado.
 */
export class UpdateShelterStatusUseCase {
  constructor(private readonly repository: IShelterRepository) {}

  async execute(id: string, novoStatusValue: ShelterStatusValue): Promise<ShelterDTO> {
    const shelter = await this.repository.findById(id);
    const novoStatus = ShelterStatus.from(novoStatusValue);

    shelter.changeStatus(novoStatus);

    const updated = await this.repository.updateStatus(shelter.id, shelter.status);
    return toShelterDTO(updated);
  }
}

