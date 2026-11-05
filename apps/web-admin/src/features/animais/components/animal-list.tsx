"use client";

import { AlertTriangle, PawPrint, SearchX } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SomenteEscrita } from "@/features/auth/components/somente-escrita";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { useAnimais, useDeleteAnimal } from "../hooks/use-animais";
import { FILTROS_VAZIOS, filtrarAnimais, type FiltrosAnimais } from "../filtros";
import type { Animal } from "../types";
import { AnimalCard, AnimalLinha } from "./animal-card";
import { AnimalFiltros } from "./animal-filtros";

export type VisaoAnimais = "grade" | "lista";

function AnimalCardSkeleton() {
  return (
    <li aria-hidden="true">
      <Card className="animate-pulse overflow-hidden p-0">
        <div className="aspect-4/3 w-full bg-card-muted" />
        <div className="flex flex-col gap-2 p-4">
          <div className="h-5 w-1/2 rounded bg-card-muted" />
          <div className="h-3 w-2/3 rounded bg-card-muted" />
          <div className="h-3 w-1/3 rounded bg-card-muted" />
        </div>
      </Card>
    </li>
  );
}

function AnimalLinhaSkeleton() {
  return (
    <li aria-hidden="true">
      <Card className="flex animate-pulse items-center gap-4 p-3">
        <div className="h-16 w-16 shrink-0 rounded-lg bg-card-muted" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-4 w-1/3 rounded bg-card-muted" />
          <div className="h-3 w-1/4 rounded bg-card-muted" />
        </div>
      </Card>
    </li>
  );
}

const CLASSES_LISTA: Record<VisaoAnimais, string> = {
  grade: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
  lista: "flex flex-col gap-2",
};

interface AnimalListProps {
  visao: VisaoAnimais;
  onNovo: VoidFunction;
  onAlterarStatus: (animal: Animal) => void;
}

export function AnimalList({ visao, onNovo, onAlterarStatus }: AnimalListProps) {
  const { data: animais, isPending, isError, refetch, isRefetching } = useAnimais();
  const excluirAnimal = useDeleteAnimal();
  const { toast } = useToast();
  const [filtros, setFiltros] = useState<FiltrosAnimais>(FILTROS_VAZIOS);

  function handleExcluir(animal: Animal) {
    if (!window.confirm(`Excluir o animal "${animal.nome}"? Essa ação não pode ser desfeita.`)) return;

    excluirAnimal.mutate(animal.id, {
      onSuccess: () => toast({ tipo: "sucesso", titulo: "Animal excluído", descricao: `${animal.nome} saiu da lista.` }),
      onError: (erro) =>
        toast({
          tipo: "erro",
          titulo: `Não foi possível excluir ${animal.nome}`,
          descricao: mensagemDeErroDaApi(erro, "Tente novamente em instantes."),
        }),
    });
  }

  // `isPending` (ainda sem dados), e não `isLoading`: com a busca pausada (sem internet ou aba
  // em segundo plano) `isLoading` é false e a tela mostraria "nenhum animal" sem ter carregado nada.
  if (isPending) {
    const Skeleton = visao === "grade" ? AnimalCardSkeleton : AnimalLinhaSkeleton;

    return (
      <ul className={CLASSES_LISTA[visao]} aria-busy="true" aria-label="Carregando animais">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </ul>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-destructive/40 bg-destructive/5 p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
        <p className="text-sm font-medium text-destructive">
          Não foi possível carregar os animais. Verifique sua conexão e tente novamente.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          {isRefetching ? "Tentando..." : "Tentar novamente"}
        </Button>
      </div>
    );
  }

  if (!animais?.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-subtle bg-card-muted p-8 text-center">
        <PawPrint className="h-8 w-8 text-muted-dark" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Nenhum animal cadastrado ainda.</p>
        <SomenteEscrita modulo="animais">
          <Button size="sm" onClick={onNovo}>
            Cadastrar novo animal
          </Button>
        </SomenteEscrita>
      </div>
    );
  }

  const filtrados = filtrarAnimais(animais, filtros);

  return (
    <div className="flex flex-col gap-4">
      <AnimalFiltros filtros={filtros} onChange={setFiltros} />

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {filtrados.length === animais.length
          ? `${animais.length} ${animais.length === 1 ? "animal" : "animais"}`
          : `Mostrando ${filtrados.length} de ${animais.length}`}
      </p>

      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-subtle bg-card-muted p-8 text-center">
          <SearchX className="h-8 w-8 text-muted-dark" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Nenhum animal encontrado com esses filtros.</p>
          <Button variant="outline" size="sm" onClick={() => setFiltros(FILTROS_VAZIOS)}>
            Limpar filtros
          </Button>
        </div>
      ) : (
        <ul className={CLASSES_LISTA[visao]}>
          {filtrados.map((animal) => {
            const acoes = {
              onAlterarStatus,
              onExcluir: handleExcluir,
              excluindo: excluirAnimal.isPending && excluirAnimal.variables === animal.id,
            };

            return (
              <li key={animal.id}>
                {visao === "grade" ? (
                  <AnimalCard animal={animal} acoes={acoes} />
                ) : (
                  <AnimalLinha animal={animal} acoes={acoes} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
