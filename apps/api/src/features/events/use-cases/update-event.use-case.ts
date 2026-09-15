import type { IEventRepository } from "../event.repository";
import { toEventDTO, type EventDTO } from "../event.dto";
import type { UpdateEventDTO } from "../schema";

/**
 * Busca a entidade, pede pra ela mesma validar e aplicar as mudanças
 * (`Event.update`, que lança `ValidationError` se algum campo ficar
 * inválido) e só então persiste — o use case só orquestra.
 */
export class UpdateEventUseCase {
  constructor(private readonly repository: IEventRepository) {}

  async execute(id: string, input: UpdateEventDTO): Promise<EventDTO> {
    const event = await this.repository.findById(id);
    event.update(input);

    const updated = await this.repository.update(id, input);
    return toEventDTO(updated);
  }
}
