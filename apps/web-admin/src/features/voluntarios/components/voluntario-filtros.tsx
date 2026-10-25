"use client";

import { Search, X } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FILTROS_VAZIOS, TODOS, temFiltroAtivo, type FiltrosVoluntarios } from "../filtros";
import { AREA_DE_AJUDA_INFO, STATUS_VOLUNTARIO_INFO, TIPO_VOLUNTARIO_INFO } from "../opcoes";
import { AREAS_DE_AJUDA, STATUS_VOLUNTARIO, TIPOS_VOLUNTARIO } from "../types";

interface FiltroSelectProps<T extends string> {
  rotulo: string;
  rotuloTodos: string;
  valor: T | typeof TODOS;
  opcoes: readonly T[];
  rotuloDe: (opcao: T) => string;
  onChange: (valor: T | typeof TODOS) => void;
}

function FiltroSelect<T extends string>({ rotulo, rotuloTodos, valor, opcoes, rotuloDe, onChange }: FiltroSelectProps<T>) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id} size="sm">
        {rotulo}
      </Label>
      <Select value={valor} onValueChange={(novo) => onChange(novo as T | typeof TODOS)}>
        <SelectTrigger id={id} selectSize="sm" variant="outline">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>{rotuloTodos}</SelectItem>
          {opcoes.map((opcao) => (
            <SelectItem key={opcao} value={opcao}>
              {rotuloDe(opcao)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface VoluntarioFiltrosProps {
  filtros: FiltrosVoluntarios;
  onChange: (filtros: FiltrosVoluntarios) => void;
}

/** Busca por texto e filtros de tipo, status e área. Tudo filtra na hora, sem recarregar a página. */
export function VoluntarioFiltros({ filtros, onChange }: VoluntarioFiltrosProps) {
  const idBusca = useId();
  const alterar = (parcial: Partial<FiltrosVoluntarios>) => onChange({ ...filtros, ...parcial });

  return (
    // `role="search"` + preventDefault: Enter na busca não envia nada nem recarrega a página.
    <form
      role="search"
      aria-label="Buscar e filtrar voluntários"
      onSubmit={(evento) => evento.preventDefault()}
      className="grid grid-cols-1 gap-3 rounded-xl border-2 border-border-subtle bg-card-muted p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2 lg:col-span-4">
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
            placeholder="Nome, e-mail ou telefone"
            autoComplete="off"
            value={filtros.busca}
            onChange={(evento) => alterar({ busca: evento.target.value })}
          />
        </div>
      </div>

      <FiltroSelect
        rotulo="Tipo"
        rotuloTodos="Todos os tipos"
        valor={filtros.tipo}
        opcoes={TIPOS_VOLUNTARIO}
        rotuloDe={(tipo) => TIPO_VOLUNTARIO_INFO[tipo].rotulo}
        onChange={(tipo) => alterar({ tipo })}
      />
      <FiltroSelect
        rotulo="Status"
        rotuloTodos="Todos os status"
        valor={filtros.status}
        opcoes={STATUS_VOLUNTARIO}
        rotuloDe={(status) => STATUS_VOLUNTARIO_INFO[status].rotulo}
        onChange={(status) => alterar({ status })}
      />
      <FiltroSelect
        rotulo="Área de ajuda"
        rotuloTodos="Todas as áreas"
        valor={filtros.area}
        opcoes={AREAS_DE_AJUDA}
        rotuloDe={(area) => AREA_DE_AJUDA_INFO[area].rotulo}
        onChange={(area) => alterar({ area })}
      />

      <div className="flex items-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full gap-1.5 sm:w-auto"
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
