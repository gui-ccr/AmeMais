import { ShelterStatus, type ShelterStatusValue } from "../domain/shelter-status.vo";
import type { IShelterRepository } from "../shelter.repository";
import { toShelterDTO, type ShelterDTO } from "../shelter.dto";

/**
 * A regra de transição de status mora no Value Object `ShelterStatus` e na
 * entidade (`Shelter.changeStatus`, que também barra inativar um lar com
 * animais), não aqui: o use case só orquestra — busca o lar e a ocupação,
 * pede pra entidade mudar de estado e persiste o resultado.
 */
export class UpdateShelterStatusUseCase {
  constructor(private readonly repository: IShelterRepository) {}

  async execute(id: string, novoStatusValue: ShelterStatusValue): Promise<ShelterDTO> {
    const shelter = await this.repository.findById(id);
    const novoStatus = ShelterStatus.from(novoStatusValue);
    const ocupacao = novoStatus.isInativo ? await this.repository.contarAnimais(id) : 0;

    shelter.changeStatus(novoStatus, ocupacao);

    const updated = await this.repository.updateStatus(shelter.id, shelter.status);
    return toShelterDTO(updated);
  }
}
