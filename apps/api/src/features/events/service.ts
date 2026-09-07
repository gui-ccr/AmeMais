import { NotFoundError, ValidationError } from "@/core/errors";
import { eventRepository } from "./repository";
import type { CreateEventInput, EventItem, UpdateEventInput } from "./schema";

/**
 * Camada de serviço de Eventos (Regras de Negócio).
 * Isolada de detalhes de transporte HTTP.
 */
export const eventService = {
  async listEvents(): Promise<EventItem[]> {
    return eventRepository.list();
  },

  async getEventById(id: string): Promise<EventItem> {
    if (!id || !id.trim()) {
      throw new ValidationError("ID do evento é obrigatório");
    }

    const event = await eventRepository.getById(id);
    if (!event) {
      throw new NotFoundError("Evento");
    }

    return event;
  },

  async createEvent(input: CreateEventInput): Promise<EventItem> {
    return eventRepository.create(input);
  },

  async updateEvent(id: string, input: UpdateEventInput): Promise<EventItem> {
    if (!id || !id.trim()) {
      throw new ValidationError("ID do evento é obrigatório");
    }

    const existing = await eventRepository.getById(id);
    if (!existing) {
      throw new NotFoundError("Evento");
    }

    const updated = await eventRepository.update(id, input);
    if (!updated) {
      throw new NotFoundError("Evento");
    }

    return updated;
  },

  async deleteEvent(id: string): Promise<void> {
    if (!id || !id.trim()) {
      throw new ValidationError("ID do evento é obrigatório");
    }

    const existing = await eventRepository.getById(id);
    if (!existing) {
      throw new NotFoundError("Evento");
    }

    await eventRepository.remove(id);
  },
};

