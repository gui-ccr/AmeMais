"use client";

import { Search, X } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FILTROS_VAZIOS, TODOS, temFiltroAtivo, type FiltrosAnimais } from "../filtros";
import { ESPECIE_INFO, STATUS_INFO } from "../opcoes";
import { ESPECIES, STATUS_ANIMAL } from "../types";

interface AnimalFiltrosProps {
  filtros: FiltrosAnimais;
  onChange: (filtros: FiltrosAnimais) => void;
}

/** Busca por nome ou raça e filtros de status e espécie. Tudo filtra na hora, sem recarregar a página. */
export function AnimalFiltros({ filtros, onChange }: AnimalFiltrosProps) {
  const idBusca = useId();
  const idStatus = useId();
  const idEspecie = useId();
  const alterar = (parcial: Partial<FiltrosAnimais>) => onChange({ ...filtros, ...parcial });

  return (
    // `role="search"` + preventDefault: Enter na busca não envia nada nem recarrega a página.
    <form
      role="search"
      aria-label="Buscar e filtrar animais"
      onSubmit={(evento) => evento.preventDefault()}
      className="grid grid-cols-1 gap-3 rounded-xl border-2 border-border-subtle bg-card-muted p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]"
    >
      <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
        <Label htmlFor={idBusca} size="sm">
          Buscar
        </Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-dark"
            aria-hidden="true"
          />
          <Input
            id={idBusca}
            type="search"
            inputSize="sm"
            variant="outline"
            className="pl-9"
            placeholder="Nome ou raça"
            autoComplete="off"
            value={filtros.busca}
            onChange={(evento) => alterar({ busca: evento.target.value })}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor={idStatus} size="sm">
          Status
        </Label>
        <Select value={filtros.status} onValueChange={(status) => alterar({ status: status as FiltrosAnimais["status"] })}>
          <SelectTrigger id={idStatus} selectSize="sm" variant="outline">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os status</SelectItem>
            {STATUS_ANIMAL.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_INFO[status].rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor={idEspecie} size="sm">
          Espécie
        </Label>
        <Select
          value={filtros.especie}
          onValueChange={(especie) => alterar({ especie: especie as FiltrosAnimais["especie"] })}
        >
          <SelectTrigger id={idEspecie} selectSize="sm" variant="outline">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas as espécies</SelectItem>
            {ESPECIES.map((especie) => (
              <SelectItem key={especie} value={especie}>
                {ESPECIE_INFO[especie].rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end sm:col-span-2 lg:col-span-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5"
          disabled={!temFiltroAtivo(filtros)}
          onClick={() => onChange(FILTROS_VAZIOS)}
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Limpar filtros
        </Button>
      </div>
    </form>
  );
}
