"use client";

import { AlertTriangle, Home, Mail, Phone, SearchX, Users } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { FILTROS_VAZIOS, filtrarVoluntarios, type FiltrosVoluntarios } from "../filtros";
import { useVoluntarios } from "../hooks/use-voluntarios";
import { AREA_DE_AJUDA_INFO, STATUS_VOLUNTARIO_INFO, TIPO_VOLUNTARIO_INFO } from "../opcoes";
import type { LarVinculado, VoluntarioDetalhe } from "../types";
import { VoluntarioFiltros } from "./voluntario-filtros";

function VoluntarioCardSkeleton() {
  return (
    <li aria-hidden="true">
      <Card className="flex animate-pulse flex-col gap-3 p-4">
        <div className="h-5 w-1/2 rounded bg-card-muted" />
        <div className="h-4 w-1/3 rounded bg-card-muted" />
        <div className="flex gap-2">
          <div className="h-5 w-24 rounded-full bg-card-muted" />
          <div className="h-5 w-20 rounded-full bg-card-muted" />
        </div>
      </Card>
    </li>
  );
}

/** O lar temporário do voluntário (já vem em cada item da lista). Sem lar, não mostra nada. */
export function LarDoVoluntario({ lar }: { lar: LarVinculado | null }) {
  if (!lar) return null;

  return (
    <p className="flex min-w-0 items-center gap-1.5 text-sm text-foreground">
      <Home className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
      <span className="truncate">
        <span className="font-medium">Lar temporário:</span> {lar.enderecoRegiao || "endereço não informado"}
      </span>
    </p>
  );
}

/** Um voluntário: nome, tipo, status, áreas de ajuda, contato e o lar vinculado (se houver). */
export function VoluntarioItem({ voluntario }: { voluntario: VoluntarioDetalhe }) {
  const status = STATUS_VOLUNTARIO_INFO[voluntario.status];
  const digitos = voluntario.telefone.replace(/\D/g, "");

  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 break-words font-semibold text-foreground">{voluntario.nome}</h3>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <Badge variant="neutral" size="sm">
            {TIPO_VOLUNTARIO_INFO[voluntario.tipo].rotulo}
          </Badge>
          <Badge variant={status.variante} size="sm">
            {status.rotulo}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm text-muted-dark">
        {digitos ? (
          <a
            href={`tel:${digitos}`}
            className="inline-flex w-fit items-center gap-1.5 hover:text-primary hover:underline"
            aria-label={`Ligar para ${voluntario.nome}: ${voluntario.telefone}`}
          >
            <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
            {voluntario.telefone}
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
            Sem telefone cadastrado
          </span>
        )}
        {voluntario.email && (
          <a
            href={`mailto:${voluntario.email}`}
            className="inline-flex min-w-0 max-w-full items-center gap-1.5 hover:text-primary hover:underline"
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{voluntario.email}</span>
          </a>
        )}
      </div>

      {voluntario.areasDeAjuda.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Áreas de ajuda">
          {voluntario.areasDeAjuda.map((area) => (
            <li key={area}>
              <Badge variant="outline" size="sm">
                {AREA_DE_AJUDA_INFO[area].rotulo}
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhuma área de ajuda informada.</p>
      )}

      <LarDoVoluntario lar={voluntario.larTemporario} />
    </Card>
  );
}

/** "1 voluntário" / "3 voluntários". */
function contar(quantidade: number): string {
  return `${quantidade} ${quantidade === 1 ? "voluntário" : "voluntários"}`;
}

/** Lista de voluntários com busca e filtros (que filtram a lista já carregada, sem recarregar a página). */
export function VoluntarioList() {
  const { data: voluntarios, isPending, isError, error, refetch, isRefetching } = useVoluntarios();
  const [filtros, setFiltros] = useState<FiltrosVoluntarios>(FILTROS_VAZIOS);

  const filtrados = voluntarios ? filtrarVoluntarios(voluntarios, filtros) : [];

  return (
    <div className="flex flex-col gap-4">
      <VoluntarioFiltros filtros={filtros} onChange={setFiltros} />

      {/* `isPending` (ainda sem dados), e não `isLoading`: com a busca pausada (sem internet ou aba
          em segundo plano) `isLoading` é false e a tela diria "nenhum voluntário" sem ter carregado. */}
      {isPending ? (
        <ul className="grid gap-3 lg:grid-cols-2" aria-busy="true" aria-label="Carregando voluntários">
          <VoluntarioCardSkeleton />
          <VoluntarioCardSkeleton />
          <VoluntarioCardSkeleton />
          <VoluntarioCardSkeleton />
        </ul>
      ) : isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-destructive/40 bg-destructive/5 p-8 text-center"
        >
          <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
          <p className="text-sm font-medium text-destructive">
            {mensagemDeErroDaApi(error, "Não foi possível carregar os voluntários. Tente novamente.")}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            {isRefetching ? "Tentando..." : "Tentar novamente"}
          </Button>
        </div>
      ) : voluntarios.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-subtle bg-card-muted p-8 text-center">
          <Users className="h-8 w-8 text-muted-dark" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Nenhum voluntário cadastrado ainda.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {filtrados.length === voluntarios.length
              ? contar(voluntarios.length)
              : `Mostrando ${filtrados.length} de ${contar(voluntarios.length)}`}
          </p>
          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-subtle bg-card-muted p-8 text-center">
              <SearchX className="h-8 w-8 text-muted-dark" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Nenhum voluntário encontrado com esses filtros.</p>
              <Button variant="outline" size="sm" onClick={() => setFiltros(FILTROS_VAZIOS)}>
                Limpar filtros
              </Button>
            </div>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {filtrados.map((voluntario) => (
                <li key={voluntario.id} className="min-w-0">
                  <VoluntarioItem voluntario={voluntario} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
