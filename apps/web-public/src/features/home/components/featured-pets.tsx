import Link from "next/link";
import { loadPets } from "@/features/adoption/api/get-pets";
import { PetGrid } from "@/features/adoption/components/pet-grid";

const FEATURED_COUNT = 4;

export async function FeaturedPets() {
  const { pets } = await loadPets();

  // Sem animais (ou API fora do ar) a seção some: um título "esperando por você" sem ninguém
  // embaixo é pior do que não ter a seção.
  if (pets.length === 0) return null;

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
          <PetGrid pets={pets.slice(0, FEATURED_COUNT)} />
        </div>
      </div>
    </section>
  );
}
