export type UserRole = "admin" | "colaborador";

export interface Profile {
  id: string;
  role: UserRole;
  nome: string;
}
