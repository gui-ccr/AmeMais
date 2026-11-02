"use client";

import { Search, X } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FILTROS_VAZIOS, TODOS, temFiltroAtivo, type FiltrosLares } from "../filtros";
import { STATUS_LAR_INFO } from "../opcoes";
import { STATUS_LAR } from "../types";

interface LarFiltrosProps {
  filtros: FiltrosLares;
  onChange: (filtros: FiltrosLares) => void;
}

/** Busca por texto, filtro de status e atalho "só com vagas". Tudo filtra na hora, sem recarregar a página. */
export function LarFiltros({ filtros, onChange }: LarFiltrosProps) {
  const idBusca = useId();
  const idStatus = useId();
  const idVagas = useId();
  const alterar = (parcial: Partial<FiltrosLares>) => onChange({ ...filtros, ...parcial });

  return (
    // `role="search"` + preventDefault: Enter na busca não envia nada nem recarrega a página.
    <form
      role="search"
      aria-label="Buscar e filtrar lares"
      onSubmit={(evento) => evento.preventDefault()}
      className="grid grid-cols-1 gap-3 rounded-xl border-2 border-border-subtle bg-card-muted p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_auto]"
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
            placeholder="Responsável ou região"
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
        <Select value={filtros.status} onValueChange={(status) => alterar({ status: status as FiltrosLares["status"] })}>
          <SelectTrigger id={idStatus} selectSize="sm" variant="outline">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os status</SelectItem>
            {STATUS_LAR.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LAR_INFO[status].rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-end gap-3 sm:col-span-2 lg:col-span-1">
        <label
          htmlFor={idVagas}
          className="flex h-8 cursor-pointer items-center gap-2 text-sm font-medium text-foreground"
        >
          <input
            id={idVagas}
            type="checkbox"
            className="h-4 w-4 accent-secondary"
            checked={filtros.somenteComVagas}
            onChange={(evento) => alterar({ somenteComVagas: evento.target.checked })}
          />
          Só com vagas
        </label>
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
