"use client";

import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VisaoAnimais } from "./animal-list";

const OPCOES = [
  { valor: "grade", rotulo: "Cards", Icone: LayoutGrid },
  { valor: "lista", rotulo: "Lista", Icone: List },
] as const;

interface VisaoToggleProps {
  visao: VisaoAnimais;
  onChange: (visao: VisaoAnimais) => void;
}

/** Alterna entre a grade de cards e a lista compacta em linhas. */
export function VisaoToggle({ visao, onChange }: VisaoToggleProps) {
  return (
    <div role="group" aria-label="Modo de visualização" className="flex gap-2">
      {OPCOES.map(({ valor, rotulo, Icone }) => (
        <Button
          key={valor}
          type="button"
          size="sm"
          variant={visao === valor ? "chip-active" : "chip"}
          aria-pressed={visao === valor}
          className="gap-1.5"
          onClick={() => onChange(valor)}
        >
          <Icone className="h-4 w-4" aria-hidden="true" />
          {rotulo}
        </Button>
      ))}
    </div>
  );
}
