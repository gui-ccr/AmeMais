import type { PublicAnimal } from "@amemais/shared-types";
import type { Pet, Species } from "../types";

const ESPECIE_PARA_SITE: Record<PublicAnimal["especie"], Species> = {
  Cachorro: "cão",
  Gato: "gato",
  Outro: "outro",
};

/** Resposta da API pública -> tipo `Pet` que os componentes já usam. */
export function mapPet(animal: PublicAnimal): Pet {
  return {
    id: animal.id,
    name: animal.nome,
    species: ESPECIE_PARA_SITE[animal.especie],
    size: animal.porte,
    ageGroup: animal.faixaEtaria,
    tag: `${animal.porte} · ${animal.idadeTexto ?? animal.faixaEtaria}`,
    description: animal.descricao ?? "",
    // Sem foto fica vazio: o cartão mostra a imagem de reserva (ver PetPhoto).
    photo: animal.urlFoto ?? "",
  };
}
