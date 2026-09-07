"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { gsap } from "@/lib/gsap";
import { PETS } from "../data/pets";
import type { AgeGroup, Size, Species } from "../types";
import { PetGrid } from "./pet-grid";

const SPECIES_OPTIONS: { value: Species | "todos"; label: string }[] = [
  { value: "todos", label: "todos" },
  { value: "cão", label: "🐶 cães" },
  { value: "gato", label: "🐱 gatos" },
];

const SIZE_OPTIONS: { value: Size | "todos"; label: string }[] = [
  { value: "todos", label: "todos" },
  { value: "P", label: "pequeno" },
  { value: "M", label: "médio" },
  { value: "G", label: "grande" },
];

const AGE_OPTIONS: { value: AgeGroup | "todos"; label: string }[] = [
  { value: "todos", label: "todos" },
  { value: "filhote", label: "filhote" },
  { value: "adulto", label: "adulto" },
  { value: "idoso", label: "idoso" },
];

export function AdoptionExplorer() {
  const [species, setSpecies] = useState<Species | "todos">("todos");
  const [size, setSize] = useState<Size | "todos">("todos");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "todos">("todos");

  const filtered = useMemo(
    () =>
      PETS.filter(
        (pet) =>
          (species === "todos" || pet.species === species) &&
          (size === "todos" || pet.size === size) &&
          (ageGroup === "todos" || pet.ageGroup === ageGroup),
      ),
    [species, size, ageGroup],
  );

  const resultsRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const el = resultsRef.current;
    if (!el) return;
    gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
  }, [species, size, ageGroup]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-y-2 border-border py-3.5">
        <span className="mr-0.5 text-base text-muted-foreground">espécie:</span>
        {SPECIES_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={species === option.value ? "chip-active" : "chip"}
            onClick={() => setSpecies(option.value)}
          >
            {option.label}
          </Button>
        ))}
        <span className="w-3.5" />
        <span className="mr-0.5 text-base text-muted-foreground">porte:</span>
        {SIZE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={size === option.value ? "chip-active" : "chip"}
            onClick={() => setSize(option.value)}
          >
            {option.label}
          </Button>
        ))}
        <span className="w-3.5" />
        <span className="mr-0.5 text-base text-muted-foreground">idade:</span>
        {AGE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={ageGroup === option.value ? "chip-active" : "chip"}
            onClick={() => setAgeGroup(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div ref={resultsRef}>
        <p className="my-3.5 text-lg text-muted-foreground">
          {filtered.length === 1 ? "1 amigo encontrado" : `${filtered.length} amigos encontrados`}
        </p>

        <PetGrid pets={filtered} />
      </div>
    </div>
  );
}
