"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { DepartamentosTab } from "@/features/equipe/components/departamentos-tab";
import { MembrosTab } from "@/features/equipe/components/membros-tab";

const ABAS = [
  { id: "membros", rotulo: "Membros" },
  { id: "departamentos", rotulo: "Departamentos e permissões" },
] as const;

type AbaId = (typeof ABAS)[number]["id"];

export default function EquipePage() {
  const [aba, setAba] = useState<AbaId>("membros");

  return (
    <section className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-12 max-w-6xl mx-auto flex flex-col gap-8">
      <div className="border-b-2 border-secondary pb-6">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">Equipe e Acessos</h1>
        <p className="text-muted-foreground text-lg mt-1">
          Quem entra no painel e o que cada departamento pode ver ou editar em cada módulo.
        </p>
      </div>

      <div role="tablist" aria-label="Seções de equipe e acessos" className="flex gap-2">
        {ABAS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`aba-${item.id}`}
            aria-selected={aba === item.id}
            aria-controls={`painel-${item.id}`}
            onClick={() => setAba(item.id)}
            className={cn(
              "rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors",
              aba === item.id
                ? "border-primary bg-primary text-white"
                : "border-border-subtle bg-white text-foreground hover:bg-card-muted",
            )}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
        {aba === "membros" ? <MembrosTab /> : <DepartamentosTab />}
      </div>
    </section>
  );
}
