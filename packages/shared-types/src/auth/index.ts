export interface Profile {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  fotoUrl: string | null;
  departamentos: string[];
}
