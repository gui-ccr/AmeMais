import type { IEventRepository } from "../event.repository";
import { toEventDTO, type EventDTO } from "../event.dto";

export class GetEventUseCase {
  constructor(private readonly repository: IEventRepository) {}

  async execute(id: string): Promise<EventDTO> {
    const event = await this.repository.findById(id);
    return toEventDTO(event);
  }
}
