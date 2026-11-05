"use client";

import { useId } from "react";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { useDepartamentosEModulos } from "../hooks/use-equipe";
import type { Departamento, Modulo } from "../types";

function resumoDeAcesso(departamento: Departamento, modulos: Modulo[]): string {
  const nomes = new Map(modulos.map((m) => [m.id, m.nome]));
  const partes = departamento.permissoes
    .filter((p) => p.nivel !== null)
    .map((p) => `${nomes.get(p.moduloId) ?? "Módulo"} (${p.nivel === "total" ? "edita" : "consulta"})`);
  return partes.length > 0 ? `Acessa: ${partes.join(", ")}` : "Sem acesso a nenhum módulo";
}

interface DepartamentosChecklistProps {
  selecionados: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

/** Lista de departamentos com caixa de seleção (um membro pode estar em vários). */
export function DepartamentosChecklist({ selecionados, onChange, disabled }: DepartamentosChecklistProps) {
  const prefixo = useId();
  const { data, isPending, isError, error } = useDepartamentosEModulos();

  if (isPending) return <p className="text-sm text-muted-foreground">Carregando departamentos...</p>;
  if (isError) {
    return (
      <p role="alert" className="text-sm font-medium text-destructive">
        {mensagemDeErroDaApi(error, "Não foi possível carregar os departamentos.")}
      </p>
    );
  }

  function alternar(id: string) {
    onChange(selecionados.includes(id) ? selecionados.filter((item) => item !== id) : [...selecionados, id]);
  }

  return (
    <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-xl border-2 border-border-subtle p-2">
      {data.departamentos.map((departamento) => {
        const id = `${prefixo}-${departamento.id}`;
        return (
          <li key={departamento.id}>
            <label htmlFor={id} className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-card-muted">
              <input
                id={id}
                type="checkbox"
                className="mt-1 h-4 w-4 accent-primary"
                checked={selecionados.includes(departamento.id)}
                disabled={disabled}
                onChange={() => alternar(departamento.id)}
              />
              <span className="min-w-0">
                <span className="block font-medium text-foreground">{departamento.nome}</span>
                {departamento.descricao && <span className="block text-sm text-muted-foreground">{departamento.descricao}</span>}
                <span className="block text-xs text-muted-foreground">{resumoDeAcesso(departamento, data.modulos)}</span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
