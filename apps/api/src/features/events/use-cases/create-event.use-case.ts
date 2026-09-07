import { Event } from "../domain/event.entity";
import type { IEventRepository } from "../event.repository";
import { toEventDTO, type EventDTO } from "../event.dto";
import type { CreateEventDTO } from "../schema";

export class CreateEventUseCase {
  constructor(private readonly repository: IEventRepository) {}

  async execute(input: CreateEventDTO): Promise<EventDTO> {
    // Valida as invariantes de domínio independente do que o schema Zod
    // já validou na borda HTTP.
    Event.create(input);

    const event = await this.repository.create(input);
    return toEventDTO(event);
  }
}
