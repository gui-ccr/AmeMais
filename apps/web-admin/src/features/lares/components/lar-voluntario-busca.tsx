"use client";

import { Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Opcional } from "@/components/ui/opcional";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { useVoluntariosParaLar } from "@/features/voluntarios/hooks/use-voluntarios";
import type { Voluntario } from "@/features/voluntarios/types";

/** Espera a pessoa parar de digitar para não chamar a API a cada tecla. */
function useValorAtrasado(valor: string, atrasoMs = 300): string {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const timer = setTimeout(() => setAtrasado(valor), atrasoMs);
    return () => clearTimeout(timer);
  }, [valor, atrasoMs]);
  return atrasado;
}

interface LarVoluntarioBuscaProps {
  /** Voluntário já escolhido (nome para mostrar), ou `null`. */
  selecionado: { id: string; nome: string } | null;
  onEscolher: (voluntario: Voluntario) => void;
  onLimpar: VoidFunction;
}

/**
 * Campo opcional para escolher o voluntário responsável pelo lar: busca só voluntários
 * ativos que ajudam com lar temporário. Quem escolhe decide o que fazer com os dados
 * (o formulário preenche responsável e contato, que continuam editáveis).
 */
export function LarVoluntarioBusca({ selecionado, onEscolher, onLimpar }: LarVoluntarioBuscaProps) {
  const id = useId();
  const [busca, setBusca] = useState("");
  const buscaAtrasada = useValorAtrasado(busca);
  const buscando = busca.trim() !== "";
  const { data, isPending, isError, error } = useVoluntariosParaLar(buscaAtrasada);

  if (selecionado) {
    return (
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <span className="text-base font-medium text-foreground">
          Voluntário responsável <Opcional />
        </span>
        <div className="flex items-center justify-between gap-2 rounded-xl border-2 border-secondary bg-secondary/10 px-3.5 py-2 text-sm">
          <span className="min-w-0 truncate font-medium">{selecionado.nome}</span>
          <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={onLimpar}>
            <X className="h-4 w-4" aria-hidden="true" />
            Trocar ou remover
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 md:col-span-2">
      <Label htmlFor={id}>
        Voluntário responsável <Opcional />
      </Label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-dark"
          aria-hidden="true"
        />
        <Input
          id={id}
          type="search"
          className="pl-9"
          placeholder="Buscar voluntário de lar temporário por nome"
          autoComplete="off"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          // Enter na busca não envia o formulário do lar.
          onKeyDown={(evento) => evento.key === "Enter" && evento.preventDefault()}
        />
      </div>

      {buscando && (
        <div className="rounded-xl border-2 border-border-subtle bg-white" aria-live="polite">
          {isPending ? (
            <p className="p-3 text-sm text-muted-foreground">Buscando...</p>
          ) : isError ? (
            <p role="alert" className="p-3 text-sm font-medium text-destructive">
              {mensagemDeErroDaApi(error, "Não foi possível buscar os voluntários.")}
            </p>
          ) : data.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              Nenhum voluntário ativo de lar temporário encontrado com essa busca.
            </p>
          ) : (
            <ul className="max-h-44 overflow-y-auto" aria-label="Voluntários encontrados">
              {data.map((voluntario) => (
                <li key={voluntario.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-card-muted focus-visible:bg-card-muted focus-visible:outline-none"
                    onClick={() => {
                      onEscolher(voluntario);
                      setBusca("");
                    }}
                  >
                    <span className="font-medium text-foreground">{voluntario.nome}</span>
                    <span className="text-xs text-muted-foreground">{voluntario.telefone || voluntario.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
