import { Home, PawPrint } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SomenteEscrita } from "@/features/auth/components/somente-escrita";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatISODateToBR } from "@/utils";
import { ESPECIE_INFO, FAIXA_ETARIA_INFO, STATUS_INFO } from "../opcoes";
import type { Animal } from "../types";

/** O que cada animal da lista pode fazer: ver detalhes, editar, trocar o status ou ser excluído. */
export interface AcoesDoAnimal {
  onVerDetalhes: (animal: Animal) => void;
  onEditar: (animal: Animal) => void;
  onAlterarStatus: (animal: Animal) => void;
  onExcluir: (animal: Animal) => void;
  /** Exclusão deste animal em andamento (desabilita os botões dele). */
  excluindo: boolean;
}

function FotoAnimal({ animal, className }: { animal: Animal; className?: string }) {
  if (!animal.urlFoto) {
    return (
      <div className={cn("flex items-center justify-center bg-card-muted", className)}>
        <PawPrint className="h-8 w-8 text-muted-dark" aria-hidden="true" />
      </div>
    );
  }

  return (
    // Foto vinda de uma URL qualquer (do Storage do Supabase): sem domínio fixo para o next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={animal.urlFoto} alt={`Foto de ${animal.nome}`} className={cn("object-cover", className)} loading="lazy" />
  );
}

/** "Adotado por Fulano · 10/09/2026" — só existe para animal adotado; os demais mostram só o selo de status. */
function textoAdocao(animal: Animal): string | null {
  if (!animal.adotante) return null;

  const data = formatISODateToBR(animal.dataAdocao);
  return data ? `Adotado por ${animal.adotante.nome} · ${data}` : `Adotado por ${animal.adotante.nome}`;
}

/** Em qual lar o animal está, com link para abrir os detalhes do lar. */
function LarDoAnimal({ animal, className }: { animal: Animal; className?: string }) {
  if (!animal.lar) return null;

  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <Home className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Lar:</span>
      <Link
        href={`/admin/lares?lar=${animal.lar.id}`}
        className="font-medium text-secondary underline-offset-2 hover:underline"
      >
        {animal.lar.nomeResponsavel}
      </Link>
    </p>
  );
}

function SeloStatus({ status }: { status: Animal["status"] }) {
  return (
    <Badge variant={STATUS_INFO[status].variante} size="sm" dot>
      {STATUS_INFO[status].rotulo}
    </Badge>
  );
}

/** "Porte M · Adulto": o que o site público mostra de cada animal. */
function textoPorteEFaixa(animal: Animal): string {
  return `Porte ${animal.porte} · ${FAIXA_ETARIA_INFO[animal.faixaEtaria].rotulo}`;
}

function BotoesDeAcao({ animal, acoes, className }: { animal: Animal; acoes: AcoesDoAnimal; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={`Ver detalhes de ${animal.nome}`}
        onClick={() => acoes.onVerDetalhes(animal)}
      >
        Detalhes
      </Button>
      <SomenteEscrita modulo="animais">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Editar ${animal.nome}`}
          disabled={acoes.excluindo}
          onClick={() => acoes.onEditar(animal)}
        >
          Editar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Alterar status de ${animal.nome}`}
          disabled={acoes.excluindo}
          onClick={() => acoes.onAlterarStatus(animal)}
        >
          Alterar status
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          aria-label={`Excluir ${animal.nome}`}
          disabled={acoes.excluindo}
          onClick={() => acoes.onExcluir(animal)}
        >
          {acoes.excluindo ? "Excluindo..." : "Excluir"}
        </Button>
      </SomenteEscrita>
    </div>
  );
}

export function AnimalCard({ animal, acoes }: { animal: Animal; acoes: AcoesDoAnimal }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <FotoAnimal animal={animal} className="aspect-4/3 w-full" />
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-display text-2xl font-bold leading-tight text-foreground">{animal.nome}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral" size="sm">
            {ESPECIE_INFO[animal.especie].rotulo}
          </Badge>
          <SeloStatus status={animal.status} />
          <span className="text-sm text-muted-dark">{animal.raca}</span>
        </div>
        <p className="text-sm text-muted-dark">{textoPorteEFaixa(animal)}</p>
        {textoAdocao(animal) && <p className="text-xs text-muted-foreground">{textoAdocao(animal)}</p>}
        <LarDoAnimal animal={animal} />
        <BotoesDeAcao animal={animal} acoes={acoes} className="mt-auto pt-3" />
      </div>
    </Card>
  );
}

export function AnimalLinha({ animal, acoes }: { animal: Animal; acoes: AcoesDoAnimal }) {
  return (
    <Card className="flex flex-wrap items-center gap-x-4 gap-y-3 p-3">
      <FotoAnimal animal={animal} className="h-16 w-16 shrink-0 rounded-lg" />
      <div className="flex min-w-40 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{animal.nome}</span>
          <Badge variant="neutral" size="sm">
            {ESPECIE_INFO[animal.especie].rotulo}
          </Badge>
          <SeloStatus status={animal.status} />
        </div>
        <span className="truncate text-sm text-muted-dark">
          {animal.raca} · {textoPorteEFaixa(animal)}
        </span>
        <LarDoAnimal animal={animal} />
      </div>
      {animal.adotante && (
        <p className="hidden shrink-0 text-right text-xs text-muted-foreground lg:block">
          {textoAdocao(animal)}
          <br />
          {animal.adotante.localidade}
        </p>
      )}
      {/* No celular os botões descem para uma linha própria, em vez de espremer o nome do animal. */}
      <BotoesDeAcao animal={animal} acoes={acoes} className="w-full sm:w-auto" />
    </Card>
  );
}
