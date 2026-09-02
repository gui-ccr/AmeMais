import type { Dispatch, SetStateAction } from "react";

interface EventoListProps {
  onEditar: Dispatch<SetStateAction<string | null>>;
}

export function EventoList({ onEditar }: EventoListProps) {
  console.log(onEditar);
  return null;
}
