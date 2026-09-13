"use client";

import { AlertTriangle, CalendarPlus } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeleteEvent, useEvents } from "../hooks/use-events";
import type { EventDTO } from "../types";

function formatarData(data: string | null): string | null {
  if (!data) return null;
  const [ano, mes, dia] = data.split("T")[0]?.split("-") ?? [];
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
}

/** Foca o campo de título do EventoForm, que fica sempre acima desta lista na mesma página. */
function focarFormularioDeCriacao() {
  const campo = document.getElementById("evento-titulo");
  campo?.scrollIntoView({ behavior: "smooth", block: "center" });
  campo?.focus();
}

function EventoCardSkeleton() {
  return (
    <li
      className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border-2 border-border-subtle bg-white p-4 animate-pulse"
      aria-hidden="true"
    >
      <div className="flex w-full max-w-xs flex-col gap-2">
        <div className="h-4 w-2/3 rounded bg-card-muted" />
        <div className="h-3 w-1/3 rounded bg-card-muted" />
      </div>
      <div className="flex shrink-0 gap-2">
        <div className="h-8 w-16 rounded-full bg-card-muted" />
        <div className="h-8 w-16 rounded-full bg-card-muted" />
      </div>
    </li>
  );
}

interface EventoListProps {
  onEditar: Dispatch<SetStateAction<EventDTO | null>>;
}

export function EventoList({ onEditar }: EventoListProps) {
  const { data: eventos, isLoading, isError, refetch, isRefetching } = useEvents();
  const excluirEvento = useDeleteEvent();

  function handleExcluir(evento: EventDTO) {
    if (window.confirm(`Excluir o evento "${evento.titulo}"?`)) {
      excluirEvento.mutate(evento.id);
    }
  }

  if (isLoading) {
    return (
      <ul className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando eventos">
        <EventoCardSkeleton />
        <EventoCardSkeleton />
        <EventoCardSkeleton />
      </ul>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-destructive/40 bg-destructive/5 p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
        <p className="text-sm font-medium text-destructive">
          Não foi possível carregar os eventos. Verifique sua conexão e tente novamente.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          {isRefetching ? "Tentando..." : "Tentar novamente"}
        </Button>
      </div>
    );
  }

  if (!eventos?.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-subtle bg-card-muted p-8 text-center">
        <CalendarPlus className="h-8 w-8 text-muted-dark" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Nenhum evento cadastrado ainda.</p>
        <Button size="sm" onClick={focarFormularioDeCriacao}>
          Criar evento
        </Button>
      </div>
    );
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
              <Badge variant={evento.isActive ? "primary" : "muted"} size="sm">
                {evento.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            {evento.dataEvento && (
              <p className="text-sm text-muted-foreground">{formatarData(evento.dataEvento)}</p>
            )}
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
