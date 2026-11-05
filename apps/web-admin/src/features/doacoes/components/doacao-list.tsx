"use client";

import { AlertTriangle, CalendarDays, Link2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SomenteEscrita } from "@/features/auth/components/somente-escrita";
import { useUrgencias } from "@/features/urgencias/hooks/use-urgencias";
import { formatarQuantidade } from "@/features/urgencias/opcoes";
import { formatISODateToBR } from "@/utils";
import { useDoacoes } from "../hooks/use-doacoes";
import { CATEGORIA_INFO } from "../opcoes";
import type { Doacao } from "../types";

function DoacaoCardSkeleton() {
  return (
    <li aria-hidden="true">
      <Card className="flex animate-pulse items-center gap-4">
        <div className="h-14 w-14 shrink-0 rounded-lg bg-card-muted" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-4 w-2/3 rounded bg-card-muted" />
          <div className="h-3 w-1/2 rounded bg-card-muted" />
        </div>
      </Card>
    </li>
  );
}

function MiniaturaDaDoacao({ doacao }: { doacao: Doacao }) {
  if (!doacao.urlFoto) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-border-subtle bg-card-muted">
        <Package className="h-6 w-6 text-muted-dark" aria-hidden="true" />
      </div>
    );
  }

  return (
    // Foto vinda de uma URL qualquer: sem domínio fixo para o next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={doacao.urlFoto} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" loading="lazy" />
  );
}

interface DoacaoItemProps {
  doacao: Doacao;
  /** Título da urgência vinculada, se já carregou; sem ele a tag mostra um texto genérico. */
  tituloDaUrgencia?: string;
  onAbrir: (doacao: Doacao) => void;
  onVerUrgencia: (urgenciaId: string) => void;
}

/**
 * Uma doação na lista: resumo (descrição, quantidade, categoria, data) que abre os
 * detalhes ao clicar. Só doação vinculada mostra a tag e o botão "Ver Urgência";
 * a avulsa não mostra nada sobre vínculo.
 */
export function DoacaoItem({ doacao, tituloDaUrgencia, onAbrir, onVerUrgencia }: DoacaoItemProps) {
  return (
    <Card className="flex flex-col gap-1 p-0 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => onAbrir(doacao)}
        aria-label={`Ver detalhes da doação: ${doacao.descricao}`}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 rounded-xl p-4 text-left transition-colors hover:bg-card-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <MiniaturaDaDoacao doacao={doacao} />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate font-semibold text-foreground">{doacao.descricao}</span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <Badge variant="neutral" size="sm">
              {CATEGORIA_INFO[doacao.categoria].rotulo}
            </Badge>
            <span className="font-medium text-muted-dark">{formatarQuantidade(doacao.quantidade, doacao.unidade)}</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {formatISODateToBR(doacao.dataEntrada)}
            </span>
          </span>
          {doacao.urgenciaId && (
            <Badge variant="urgent" size="sm" className="max-w-full justify-start gap-1">
              <Link2 className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">
                Urgência{tituloDaUrgencia ? `: ${tituloDaUrgencia}` : " vinculada"}
              </span>
            </Badge>
          )}
        </span>
      </button>

      {doacao.urgenciaId && (
        <div className="px-4 pb-4 sm:p-4 sm:pl-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => onVerUrgencia(doacao.urgenciaId!)}
          >
            Ver Urgência
          </Button>
        </div>
      )}
    </Card>
  );
}

interface DoacaoListProps {
  onAbrir: (doacao: Doacao) => void;
  onVerUrgencia: (urgenciaId: string) => void;
  onNova: VoidFunction;
}

export function DoacaoList({ onAbrir, onVerUrgencia, onNova }: DoacaoListProps) {
  const { data: doacoes, isPending, isError, refetch, isRefetching } = useDoacoes();
  // Só para escrever o nome da urgência na tag; se falhar ou demorar, a tag usa um texto genérico.
  const { data: urgencias } = useUrgencias();

  // `isPending` (ainda sem dados), e não `isLoading`: com a busca pausada (sem internet ou aba
  // em segundo plano) `isLoading` é false e a tela mostraria "nenhuma doação" sem ter carregado nada.
  if (isPending) {
    return (
      <ul className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando doações">
        <DoacaoCardSkeleton />
        <DoacaoCardSkeleton />
        <DoacaoCardSkeleton />
      </ul>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-destructive/40 bg-destructive/5 p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
        <p className="text-sm font-medium text-destructive">
          Não foi possível carregar as doações. Verifique sua conexão e tente novamente.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          {isRefetching ? "Tentando..." : "Tentar novamente"}
        </Button>
      </div>
    );
  }

  if (!doacoes?.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-subtle bg-card-muted p-8 text-center">
        <Package className="h-8 w-8 text-muted-dark" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Nenhuma doação registrada ainda.</p>
        <SomenteEscrita modulo="doacoes">
          <Button size="sm" onClick={onNova}>
          Registrar doação
        </Button>
        </SomenteEscrita>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {doacoes.map((doacao) => (
        <li key={doacao.id}>
          <DoacaoItem
            doacao={doacao}
            tituloDaUrgencia={urgencias?.find((urgencia) => urgencia.id === doacao.urgenciaId)?.titulo}
            onAbrir={onAbrir}
            onVerUrgencia={onVerUrgencia}
          />
        </li>
      ))}
    </ul>
  );
}
