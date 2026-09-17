import type { IUrgencyRepository } from "../urgency.repository";
import { toUrgencyDTO, type UrgencyDTO } from "../urgency.dto";
import type { UpdateUrgencyDTO } from "../schema";

/**
 * Busca a entidade, pede para ela mesma validar e aplicar as mudanças
 * (`Urgency.update`, que lança `ValidationError` se algum campo ficar inválido)
 * e só então persiste via repository — o use case apenas orquestra o fluxo.
 */
export class UpdateUrgencyUseCase {
  constructor(private readonly repository: IUrgencyRepository) {}

  async execute(id: string, input: UpdateUrgencyDTO): Promise<UrgencyDTO> {
    const urgency = await this.repository.findById(id);
    urgency.update(input);

    const updated = await this.repository.update(id, input);
    return toUrgencyDTO(updated);
  }
}
