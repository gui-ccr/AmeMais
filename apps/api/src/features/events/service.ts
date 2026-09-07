import { NotFoundError } from "@/core/errors";
import { eventRepository } from "./repository";
import type {
  CreateEventInput,
  UpdateEventInput,
} from "./schema";

export const eventService = {
  async listEvents() {
    return eventRepository.list();
  },

  async createEvent(input: CreateEventInput) {
    return eventRepository.create(input);
  },

  async updateEvent(id: string, input: UpdateEventInput) {
    const existingEvent = await eventRepository.findById(id);

    if (!existingEvent) {
      throw new NotFoundError("Evento");
    }

    return eventRepository.update(id, input);
  },

  async deleteEvent(id: string) {
    const existingEvent = await eventRepository.findById(id);

    if (!existingEvent) {
      throw new NotFoundError("Evento");
    }

    const deleted = await eventRepository.delete(id);

    if (!deleted) {
      throw new NotFoundError("Evento");
    }
  },
};