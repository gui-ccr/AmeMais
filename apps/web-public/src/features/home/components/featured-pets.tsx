import Link from "next/link";
import { PETS } from "@/features/adoption/data/pets";
import { PetGrid } from "@/features/adoption/components/pet-grid";

export function FeaturedPets() {
  return (
    <section className="border-y-2 border-border bg-white">
      <div className="mx-auto max-w-6xl px-6 py-13.5">
        <div className="flex flex-wrap items-baseline gap-3.5">
          <h2 className="font-display text-5xl font-bold">Eles estão esperando por você</h2>
          <Link href="/adote" className="text-xl">
            ver todos →
          </Link>
        </div>
        <div className="mt-6">
          <PetGrid pets={PETS.slice(0, 4)} />
        </div>
      </div>
    </section>
  );
}
