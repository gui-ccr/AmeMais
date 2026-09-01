export type Species = "cão" | "gato";
export type Size = "P" | "M" | "G";
export type AgeGroup = "filhote" | "adulto" | "idoso";

export interface Pet {
  id: string;
  name: string;
  species: Species;
  size: Size;
  ageGroup: AgeGroup;
  tag: string;
  description: string;
  photo: string;
}
