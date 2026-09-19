"use client";

import { AlertTriangle, HeartHandshake } from "lucide-react";
import type { Dispatch } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDeleteUrgencia, useUrgencias } from "../hooks/use-urgencias";
import type { Urgencia } from "../types";

function UrgenciaCardSkeleton() {
  return (
    <li aria-hidden="true">
      <Card className="flex items-center gap-4 animate-pulse">
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

interface UrgenciaListProps {
  onEditar: Dispatch<Urgencia>;
  onNovo: VoidFunction;
}

export function UrgenciaList({ onEditar, onNovo }: UrgenciaListProps) {
  const { data: urgencias, isLoading, isError, refetch, isRefetching } = useUrgencias();
  const excluirUrgencia = useDeleteUrgencia();

  function handleExcluir(urgencia: Urgencia) {
    if (window.confirm(`Excluir a urgência "${urgencia.titulo}"?`)) {
      excluirUrgencia.mutate(urgencia.id);
    }
  }

  if (isLoading) {
    return (
      <ul className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando urgências">
        <UrgenciaCardSkeleton />
        <UrgenciaCardSkeleton />
        <UrgenciaCardSkeleton />
      </ul>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-destructive/40 bg-destructive/5 p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
        <p className="text-sm font-medium text-destructive">
          Não foi possível carregar as urgências. Verifique sua conexão e tente novamente.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          {isRefetching ? "Tentando..." : "Tentar novamente"}
        </Button>
      </div>
    );
  }

  if (!urgencias?.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-subtle bg-card-muted p-8 text-center">
        <HeartHandshake className="h-8 w-8 text-muted-dark" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Nenhuma urgência cadastrada ainda.</p>
        <Button size="sm" onClick={onNovo}>
          Adicionar urgência
        </Button>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {urgencias.map((urgencia) => (
        <li key={urgencia.id}>
          <Card className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground">{urgencia.titulo}</span>
                <Badge variant={urgencia.ativo ? "urgent" : "neutral"} size="sm" dot>
                  {urgencia.ativo ? "Ativa" : "Atendida"}
                </Badge>
              </div>
              {urgencia.descricao && (
                <p className="truncate text-sm text-muted-foreground">{urgencia.descricao}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => onEditar(urgencia)}>
                Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleExcluir(urgencia)}>
                Excluir
              </Button>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
