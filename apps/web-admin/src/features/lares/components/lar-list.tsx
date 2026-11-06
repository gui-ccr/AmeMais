"use client";

import { AlertTriangle, Cat, Dog, Home, MapPin, Phone, SearchX } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { FILTROS_VAZIOS, filtrarLares, type FiltrosLares } from "../filtros";
import { useLares } from "../hooks/use-lares";
import { STATUS_LAR_INFO } from "../opcoes";
import { formatarContato } from "../schema";
import type { Lar } from "../types";
import { LarFiltros } from "./lar-filtros";

function LarCardSkeleton() {
  return (
    <li aria-hidden="true">
      <Card className="flex animate-pulse flex-col gap-3 p-4">
        <div className="h-5 w-1/2 rounded bg-card-muted" />
        <div className="h-4 w-1/3 rounded bg-card-muted" />
        <div className="h-4 w-2/3 rounded bg-card-muted" />
      </Card>
    </li>
  );
}

/** "3 vagas" / "1 vaga" / "Sem vagas". */
export function rotuloDeVagas(vagas: number): string {
  if (vagas <= 0) return "Sem vagas";
  return `${vagas} ${vagas === 1 ? "vaga" : "vagas"}`;
}

/** Um lar no cartão da lista: responsável, região, status, capacidade e vagas. Clicar abre os detalhes. */
export function LarItem({ lar, onAbrir }: { lar: Lar; onAbrir: (id: string) => void }) {
  const status = STATUS_LAR_INFO[lar.status];

  return (
    <button
      type="button"
      onClick={() => onAbrir(lar.id)}
      aria-label={`Ver detalhes do lar de ${lar.nomeResponsavel}`}
      className="block h-full w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Card className="flex h-full flex-col gap-3 p-4 transition-colors hover:border-primary">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="min-w-0 break-words font-semibold text-foreground">{lar.nomeResponsavel}</h3>
          <Badge variant={status.variante} size="sm">
            {status.rotulo}
          </Badge>
        </div>

        <div className="flex flex-col gap-1 text-sm text-muted-dark">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{lar.enderecoRegiao || "Região não informada"}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{formatarContato(lar.contato)}</span>
          </span>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1.5 text-foreground">
            <Home className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
            Capacidade: <strong>{lar.capacidade}</strong>
          </span>
          <span className={lar.vagas > 0 ? "font-medium text-status-success-fg" : "font-medium text-muted-dark"}>
            {rotuloDeVagas(lar.vagas)}
          </span>
          {lar.aceitaGatos && <Cat className="h-4 w-4 text-muted-dark" aria-label="Aceita gatos" />}
          {lar.aceitaCachorros && <Dog className="h-4 w-4 text-muted-dark" aria-label="Aceita cachorros" />}
        </div>
      </Card>
    </button>
  );
}

/** "1 lar" / "3 lares". */
function contar(quantidade: number): string {
  return `${quantidade} ${quantidade === 1 ? "lar" : "lares"}`;
}

interface LarListProps {
  onNovo?: VoidFunction;
  onAbrir: (id: string) => void;
}

/** Lista de lares com busca e filtros (que filtram a lista já carregada, sem recarregar a página). */
export function LarList({ onNovo, onAbrir }: LarListProps) {
  const { data: lares, isPending, isError, error, refetch, isRefetching } = useLares();
  const [filtros, setFiltros] = useState<FiltrosLares>(FILTROS_VAZIOS);

  const filtrados = lares ? filtrarLares(lares, filtros) : [];

  return (
    <div className="flex flex-col gap-4">
      <LarFiltros filtros={filtros} onChange={setFiltros} />

      {/* `isPending` (ainda sem dados), e não `isLoading`: com a busca pausada `isLoading` é false
          e a tela diria "nenhum lar" sem ter carregado. */}
      {isPending ? (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Carregando lares">
          <LarCardSkeleton />
          <LarCardSkeleton />
          <LarCardSkeleton />
          <LarCardSkeleton />
        </ul>
      ) : isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-destructive/40 bg-destructive/5 p-8 text-center"
        >
          <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
          <p className="text-sm font-medium text-destructive">
            {mensagemDeErroDaApi(error, "Não foi possível carregar os lares. Tente novamente.")}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            {isRefetching ? "Tentando..." : "Tentar novamente"}
          </Button>
        </div>
      ) : lares.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-subtle bg-card-muted p-8 text-center">
          <Home className="h-8 w-8 text-muted-dark" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Nenhum lar temporário cadastrado ainda.</p>
          {onNovo && (
            <Button size="sm" onClick={onNovo}>
              Cadastrar lar
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {filtrados.length === lares.length
              ? contar(lares.length)
              : `Mostrando ${filtrados.length} de ${contar(lares.length)}`}
          </p>
          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-subtle bg-card-muted p-8 text-center">
              <SearchX className="h-8 w-8 text-muted-dark" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Nenhum lar encontrado com esses filtros.</p>
              <Button variant="outline" size="sm" onClick={() => setFiltros(FILTROS_VAZIOS)}>
                Limpar filtros
              </Button>
            </div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtrados.map((lar) => (
                <li key={lar.id} className="min-w-0">
                  <LarItem lar={lar} onAbrir={onAbrir} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
