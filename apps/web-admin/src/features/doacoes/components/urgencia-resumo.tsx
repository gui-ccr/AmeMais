"use client";

import { AlertTriangle, CalendarClock, Tag } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressoMeta } from "@/features/urgencias/components/urgencia-list";
import { useUrgencias } from "@/features/urgencias/hooks/use-urgencias";
import { PRIORIDADE_INFO, TIPO_INFO } from "@/features/urgencias/opcoes";
import { extrairDia, formatarDia, getSituacaoUrgencia } from "@/features/urgencias/situacao";

/**
 * Resumo da urgência à qual uma doação está vinculada: usado no "Ver Urgência" da
 * lista e na tela de detalhes da doação. Busca na lista de urgências (já em cache
 * se a pessoa abriu o módulo) e mostra carregando, erro e "não encontrada".
 */
export function UrgenciaResumo({ urgenciaId }: { urgenciaId: string }) {
  const { data: urgencias, isPending, isError, refetch, isRefetching } = useUrgencias();

  if (isPending) {
    return (
      <div className="flex animate-pulse flex-col gap-2" aria-busy="true" aria-label="Carregando urgência">
        <div className="h-5 w-2/3 rounded bg-card-muted" />
        <div className="h-3 w-1/2 rounded bg-card-muted" />
        <div className="h-2 w-full rounded bg-card-muted" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          Não foi possível carregar a urgência.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          {isRefetching ? "Tentando..." : "Tentar novamente"}
        </Button>
      </div>
    );
  }

  const urgencia = urgencias?.find((item) => item.id === urgenciaId);

  if (!urgencia) {
    return <p className="text-sm text-muted-foreground">Esta urgência não está mais cadastrada.</p>;
  }

  const prioridade = PRIORIDADE_INFO[urgencia.prioridade];
  const situacao = getSituacaoUrgencia(urgencia);
  const dataLimite = extrairDia(urgencia.dataLimite);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-foreground">{urgencia.titulo}</span>
        <Badge variant={prioridade.variante} size="sm" dot>
          {prioridade.rotulo}
        </Badge>
        <Badge variant={situacao.variante} size="sm" title={situacao.descricao}>
          {situacao.rotulo}
        </Badge>
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
      <p className="text-sm text-muted-foreground">{situacao.descricao}</p>
      {urgencia.descricao && <p className="text-sm text-muted-dark">{urgencia.descricao}</p>}
      <Link
        href="/admin/urgencias"
        className="w-fit text-sm font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
      >
        Abrir o módulo de urgências
      </Link>
    </div>
  );
}
