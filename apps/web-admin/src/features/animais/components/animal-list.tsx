"use client";

import { AlertTriangle, PawPrint } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatISODateToBR } from "@/utils";
import { useAnimais } from "../hooks/use-animais";
import { ESPECIE_INFO } from "../opcoes";
import type { Animal } from "../types";

export type VisaoAnimais = "grade" | "lista";

function FotoAnimal({ animal, className }: { animal: Animal; className?: string }) {
  if (!animal.urlFoto) {
    return (
      <div className={cn("flex items-center justify-center bg-card-muted", className)}>
        <PawPrint className="h-8 w-8 text-muted-dark" aria-hidden="true" />
      </div>
    );
  }

  return (
    // Foto vinda de uma URL qualquer (ou data URL, no mock): sem domínio fixo para o next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={animal.urlFoto} alt={`Foto de ${animal.nome}`} className={cn("object-cover", className)} loading="lazy" />
  );
}

function textoAdocao(animal: Animal): string {
  const data = formatISODateToBR(animal.dataAdocao);
  return data ? `Adotado por ${animal.adotante.nome} · ${data}` : `Adotado por ${animal.adotante.nome}`;
}

function AnimalCard({ animal }: { animal: Animal }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <FotoAnimal animal={animal} className="aspect-4/3 w-full" />
      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="font-display text-2xl font-bold leading-tight text-foreground">{animal.nome}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral" size="sm">
            {ESPECIE_INFO[animal.especie].rotulo}
          </Badge>
          <span className="text-sm text-muted-dark">{animal.raca}</span>
        </div>
        <p className="text-xs text-muted-foreground">{textoAdocao(animal)}</p>
      </div>
    </Card>
  );
}

function AnimalLinha({ animal }: { animal: Animal }) {
  return (
    <Card className="flex items-center gap-4 p-3">
      <FotoAnimal animal={animal} className="h-16 w-16 shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{animal.nome}</span>
          <Badge variant="neutral" size="sm">
            {ESPECIE_INFO[animal.especie].rotulo}
          </Badge>
        </div>
        <span className="truncate text-sm text-muted-dark">{animal.raca}</span>
      </div>
      <p className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
        {textoAdocao(animal)}
        <br />
        {animal.adotante.localidade}
      </p>
    </Card>
  );
}

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
}

export function AnimalList({ visao, onNovo }: AnimalListProps) {
  const { data: animais, isPending, isError, refetch, isRefetching } = useAnimais();

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
        <Button size="sm" onClick={onNovo}>
          Cadastrar novo animal
        </Button>
      </div>
    );
  }

  return (
    <ul className={CLASSES_LISTA[visao]}>
      {animais.map((animal) => (
        <li key={animal.id}>{visao === "grade" ? <AnimalCard animal={animal} /> : <AnimalLinha animal={animal} />}</li>
      ))}
    </ul>
  );
}
