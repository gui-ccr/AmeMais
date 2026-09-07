export interface Urgencia {
  id: string;
  titulo: string;
  descricao: string;
  ativo: boolean;
  createdAt: string;
}

export interface UrgenciaFormValues {
  titulo: string;
  descricao: string;
  ativo: boolean;
}
