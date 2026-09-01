import { Reveal } from "@/components/ui/reveal";
import type { Pet } from "../types";
import { PetCard } from "./pet-card";

export function PetGrid({ pets }: { pets: Pet[] }) {
  return (
    <Reveal selector="[data-reveal-item]" className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5">
      {pets.map((pet) => (
        <PetCard key={pet.id} pet={pet} />
      ))}
    </Reveal>
  );
}
