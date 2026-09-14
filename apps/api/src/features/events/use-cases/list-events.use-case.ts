import type { IEventRepository } from "../event.repository";
import { toEventDTO, type EventDTO } from "../event.dto";

export class ListEventsUseCase {
  constructor(private readonly repository: IEventRepository) {}

  async execute(): Promise<EventDTO[]> {
    const events = await this.repository.list();
    return events.map(toEventDTO);
  }
}
