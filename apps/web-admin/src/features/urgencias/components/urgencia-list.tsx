"use client";

import { AlertTriangle, CalendarClock, EyeOff, HeartHandshake, Tag } from "lucide-react";
import type { Dispatch } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SomenteEscrita } from "@/features/auth/components/somente-escrita";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { useDeleteUrgencia, useUrgencias } from "../hooks/use-urgencias";
import { PRIORIDADE_INFO, TIPO_INFO, formatarQuantidade } from "../opcoes";
import { calcularPercentual, compararUrgencias, formatarDia, getSituacaoUrgencia, extrairDia } from "../situacao";
import type { Urgencia } from "../types";

export function ProgressoMeta({ urgencia, atendida }: { urgencia: Urgencia; atendida: boolean }) {
  const percentual = calcularPercentual(urgencia.meta, urgencia.arrecadado);
  if (percentual === null || urgencia.meta === null) return null;

  const legenda = `${formatarQuantidade(urgencia.arrecadado, urgencia.unidade)} de ${formatarQuantidade(urgencia.meta, urgencia.unidade)}`;

  return (
    <div className="flex max-w-sm items-center gap-3">
      <div
        role="progressbar"
        aria-valuenow={percentual}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Arrecadado: ${legenda}`}
        className="h-2 min-w-24 flex-1 overflow-hidden rounded-full border border-border-subtle bg-card-muted"
      >
        <div
          className={cn("h-full rounded-full", atendida ? "bg-status-success-fg" : "bg-primary")}
          style={{ width: `${percentual}%` }}
        />
      </div>
      <span className="shrink-0 text-xs font-medium text-muted-dark">
        {legenda} · {percentual}%
      </span>
    </div>
  );
}

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
        <SomenteEscrita modulo="urgencias">
          <Button size="sm" onClick={onNovo}>
            Adicionar urgência
          </Button>
        </SomenteEscrita>
      </div>
    );
  }

  const agora = new Date();
  const ordenadas = [...urgencias].sort((a, b) => compararUrgencias(a, b, agora));

  return (
    <ul className="flex flex-col gap-3">
      {ordenadas.map((urgencia) => {
        const prioridade = PRIORIDADE_INFO[urgencia.prioridade];
        const situacao = getSituacaoUrgencia(urgencia, agora);
        const dataLimite = extrairDia(urgencia.dataLimite);
        // Em andamento é o estado normal e não precisa de selo; só destacamos o que pede atenção.
        const destacarSituacao = situacao.chave !== "em-andamento";

        return (
          <li key={urgencia.id}>
            <Card className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{urgencia.titulo}</span>
                  <Badge variant={prioridade.variante} size="sm" dot>
                    {prioridade.rotulo}
                  </Badge>
                  {destacarSituacao && (
                    <Badge variant={situacao.variante} size="sm" title={situacao.descricao}>
                      {situacao.rotulo}
                    </Badge>
                  )}
                  {!urgencia.ativo && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                      Oculta no site
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                    {TIPO_INFO[urgencia.tipo].rotulo}
                  </span>
                  {dataLimite && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                      Até {formatarDia(dataLimite)}
                    </span>
                  )}
                </div>
                <ProgressoMeta urgencia={urgencia} atendida={situacao.chave === "atendida"} />
                {urgencia.descricao && (
                  <p className="truncate text-sm text-muted-foreground">{urgencia.descricao}</p>
                )}
              </div>
              <SomenteEscrita modulo="urgencias">
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => onEditar(urgencia)}>
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleExcluir(urgencia)}>
                    Excluir
                  </Button>
                </div>
              </SomenteEscrita>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
