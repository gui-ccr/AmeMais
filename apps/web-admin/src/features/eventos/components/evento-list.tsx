"use client";

import { AlertTriangle, CalendarPlus, Eye, EyeOff } from "lucide-react";
import type { Dispatch } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDeleteEvent, useEvents } from "../hooks/use-events";
import type { EventDTO } from "../types";
import { EventoStatusBadge } from "./evento-status-badge";

const MESES_ABREVIADOS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function DataBadge({ data }: { data: string | null }) {
  const partes = data?.split("T")[0]?.split("-");
  if (!partes || partes.length !== 3) return null;

  const [, mes, dia] = partes;
  const mesAbreviado = MESES_ABREVIADOS[Number(mes) - 1];
  if (!mesAbreviado) return null;

  return (
    <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-border-subtle bg-card-muted py-2">
      <span className="text-lg font-bold leading-none text-primary">{dia}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {mesAbreviado}
      </span>
    </div>
  );
}

function EventoCardSkeleton() {
  return (
    <li aria-hidden="true">
      <Card className="flex items-center gap-4 animate-pulse">
        <div className="h-14 w-14 shrink-0 rounded-lg bg-card-muted" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-4 w-2/3 rounded bg-card-muted" />
          <div className="h-3 w-1/3 rounded bg-card-muted" />
        </div>
        <div className="flex shrink-0 gap-2">
          <div className="h-8 w-16 rounded-full bg-card-muted" />
          <div className="h-8 w-16 rounded-full bg-card-muted" />
        </div>
      </Card>
    </li>
  );
}

interface EventoListProps {
  onEditar: Dispatch<EventDTO>;
  onNovo: VoidFunction;
}

export function EventoList({ onEditar, onNovo }: EventoListProps) {
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
        <Button size="sm" onClick={onNovo}>
          Criar evento
        </Button>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {eventos.map((evento) => (
        <li key={evento.id}>
          <Card className="flex flex-col sm:flex-row sm:items-center gap-4">
            <DataBadge data={evento.dataEvento} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground">{evento.titulo}</span>
                <EventoStatusBadge evento={evento} />
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {evento.isActive ? (
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {evento.isActive ? "Visível no site" : "Oculto no site"}
                </span>
              </div>
              {evento.descricao && (
                <p className="truncate text-sm text-muted-foreground">{evento.descricao}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => onEditar(evento)}>
                Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleExcluir(evento)}>
                Excluir
              </Button>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
