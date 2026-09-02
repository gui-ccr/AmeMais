"use client";

import type { Dispatch, SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeleteUrgencia, useUrgencias } from "../hooks/use-urgencias";
import type { Urgencia } from "../types";

interface UrgenciaListProps {
  onEditar: Dispatch<SetStateAction<Urgencia | null>>;
}

export function UrgenciaList({ onEditar }: UrgenciaListProps) {
  const { data: urgencias, isLoading, isError } = useUrgencias();
  const excluirUrgencia = useDeleteUrgencia();

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando urgências...</p>;
  if (isError) return <p className="text-sm text-destructive">Erro ao carregar urgências.</p>;

  if (!urgencias?.length) {
    return <p className="text-sm text-muted-foreground">Nenhuma urgência cadastrada ainda.</p>;
  }

  function handleExcluir(urgencia: Urgencia) {
    if (window.confirm(`Excluir a urgência "${urgencia.titulo}"?`)) {
      excluirUrgencia.mutate(urgencia.id);
    }
  }

  return (
    <ul className="flex flex-col gap-3">
      {urgencias.map((urgencia) => (
        <li
          key={urgencia.id}
          className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border-2 border-border-subtle bg-white p-4"
        >
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">{urgencia.titulo}</span>
              <Badge variant={urgencia.ativo ? "urgent" : "neutral"} size="sm" dot>
                {urgencia.ativo ? "Ativa" : "Atendida"}
              </Badge>
            </div>
            {urgencia.descricao && <p className="text-sm text-muted-foreground">{urgencia.descricao}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => onEditar(urgencia)}>
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleExcluir(urgencia)}>
              Excluir
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
