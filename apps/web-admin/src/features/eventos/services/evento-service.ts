import { api } from "@/lib/axios";
import type { CreateEventDTO, EventDTO, UpdateEventDTO } from "../types";

export const eventoService = {
  async list(): Promise<EventDTO[]> {
    const { data } = await api.get<{ data: EventDTO[] }>("/api/events");
    return data.data;
  },

  async create(input: CreateEventDTO): Promise<EventDTO> {
    const { data } = await api.post<{ data: EventDTO }>("/api/events", input);
    return data.data;
  },

  async update(id: string, input: UpdateEventDTO): Promise<EventDTO> {
    const { data } = await api.patch<{ data: EventDTO }>(`/api/events/${id}`, input);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/events/${id}`);
  },
};
