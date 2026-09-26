/**
 * Espelha 1:1 apps/api/src/features/events/event.dto.ts e schema.ts —
 * não adicionar campo aqui sem existir no DTO/schema real do backend.
 */
export interface EventDTO {
  id: string;
  titulo: string;
  descricao: string | null;
  dataEvento: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateEventDTO {
  titulo: string;
  descricao?: string;
  dataEvento?: string;
  isActive: boolean;
}

/** No PATCH, campo ausente = não alterar; `null` = limpar `descricao`/`dataEvento`. */
export type UpdateEventDTO = Partial<Pick<CreateEventDTO, "titulo" | "isActive">> & {
  descricao?: string | null;
  dataEvento?: string | null;
};
