"use client";

import type { Dispatch, SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeleteEvent, useEvents } from "../hooks/use-events";
import type { Evento, TipoEvento } from "../types";

const badgeVariantPorTipo: Record<TipoEvento, "primary" | "secondary" | "warning" | "muted"> = {
  "Feira de Adoção": "primary",
  Mutirão: "secondary",
  Bazar: "warning",
  Outro: "muted",
};

function formatarData(data: string): string {
  const [ano, mes, dia] = data.split("-");
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
}

interface EventoListProps {
  onEditar: Dispatch<SetStateAction<Evento | null>>;
}

export function EventoList({ onEditar }: EventoListProps) {
  const { data: eventos, isLoading, isError } = useEvents();
  const excluirEvento = useDeleteEvent();

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando eventos...</p>;
  if (isError) return <p className="text-sm text-destructive">Erro ao carregar eventos.</p>;

  if (!eventos?.length) {
    return <p className="text-sm text-muted-foreground">Nenhum evento cadastrado ainda.</p>;
  }

  function handleExcluir(evento: Evento) {
    if (window.confirm(`Excluir o evento "${evento.titulo}"?`)) {
      excluirEvento.mutate(evento.id);
    }
  }

  return (
    <ul className="flex flex-col gap-3">
      {eventos.map((evento) => (
        <li
          key={evento.id}
          className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border-2 border-border-subtle bg-white p-4"
        >
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">{evento.titulo}</span>
              <Badge variant={badgeVariantPorTipo[evento.tipo]} size="sm">
                {evento.tipo}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatarData(evento.dataEvento)}
              {evento.local && ` · ${evento.local}`}
            </p>
            {evento.descricao && <p className="text-sm text-foreground">{evento.descricao}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => onEditar(evento)}>
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleExcluir(evento)}>
              Excluir
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
