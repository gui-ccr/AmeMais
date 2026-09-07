export const TIPOS_EVENTO = ["Feira de Adoção", "Mutirão", "Bazar", "Outro"] as const;

export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export interface Evento {
  id: string;
  titulo: string;
  tipo: TipoEvento;
  descricao: string;
  dataEvento: string;
  local: string;
  createdAt: string;
}

export interface EventoFormValues {
  titulo: string;
  tipo: TipoEvento;
  descricao: string;
  dataEvento: string;
  local: string;
}
