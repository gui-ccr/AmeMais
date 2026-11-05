"use client";

import { useId } from "react";
import type { Modulo, NivelDeAcesso } from "../types";

export type NiveisPorModulo = Record<string, NivelDeAcesso | null>;

const SEM_ACESSO = "";
const OPCOES: { valor: string; rotulo: string }[] = [
  { valor: SEM_ACESSO, rotulo: "Sem acesso" },
  { valor: "leitura", rotulo: "Só consulta" },
  { valor: "total", rotulo: "Consulta e edição" },
];

interface MatrizPermissoesCamposProps {
  modulos: Modulo[];
  niveis: NiveisPorModulo;
  onChange: (niveis: NiveisPorModulo) => void;
  disabled?: boolean;
}

/** Uma linha por módulo: o que as pessoas do departamento podem fazer (nada, só consultar ou editar). */
export function MatrizPermissoesCampos({ modulos, niveis, onChange, disabled }: MatrizPermissoesCamposProps) {
  const prefixo = useId();
  return (
    <ul className="flex max-h-72 flex-col divide-y divide-border-subtle overflow-y-auto rounded-xl border-2 border-border-subtle">
      {modulos.map((modulo) => {
        const id = `${prefixo}-${modulo.id}`;
        return (
          <li key={modulo.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <label htmlFor={id} className="font-medium text-foreground">
              {modulo.nome}
            </label>
            <select
              id={id}
              className="h-9 rounded-lg border-2 border-border-subtle bg-card-muted px-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={niveis[modulo.id] ?? SEM_ACESSO}
              disabled={disabled}
              onChange={(evento) => {
                const valor = evento.target.value;
                onChange({ ...niveis, [modulo.id]: valor === SEM_ACESSO ? null : (valor as NivelDeAcesso) });
              }}
            >
              {OPCOES.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </select>
          </li>
        );
      })}
    </ul>
  );
}

export function niveisIniciais(modulos: Modulo[], permissoes: { moduloId: string; nivel: NivelDeAcesso | null }[]): NiveisPorModulo {
  return Object.fromEntries(modulos.map((m) => [m.id, permissoes.find((p) => p.moduloId === m.id)?.nivel ?? null]));
}
