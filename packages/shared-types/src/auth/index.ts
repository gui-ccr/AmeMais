export type UserRole = "Admin" | "Voluntário" | "Adotante";

export interface Profile {
  id: string;
  nome: string;
  email: string;
  cargo: UserRole;
}
