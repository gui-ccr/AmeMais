"use client";

import { Check, Copy, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SenhaProvisoriaPainelProps {
  /** Quem vai usar a senha (nome ou e-mail), para o admin saber a quem repassar. */
  para: string;
  senha: string;
  onFechar: VoidFunction;
}

/**
 * Mostra a senha provisória UMA vez. Ela só vive no estado do componente: não vai para cache
 * do React Query, URL nem storage, e some ao fechar o painel.
 */
export function SenhaProvisoriaPainel({ para, senha, onFechar }: SenhaProvisoriaPainelProps) {
  const [copiada, setCopiada] = useState(false);
  const [falhaAoCopiar, setFalhaAoCopiar] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(senha);
      setCopiada(true);
      setFalhaAoCopiar(false);
    } catch {
      setFalhaAoCopiar(true);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-dark">
        Senha provisória de <span className="font-semibold text-foreground">{para}</span>. Repasse à pessoa por um canal
        seguro: ela será obrigada a trocar a senha no primeiro acesso.
      </p>

      <div className="flex items-center gap-2 rounded-xl border-2 border-secondary bg-card-muted p-3">
        <code aria-label="Senha provisória" className="min-w-0 flex-1 select-all break-all font-mono text-lg tracking-wide">
          {senha}
        </code>
        <Button type="button" size="sm" variant="outline" onClick={copiar} className="shrink-0 gap-1.5">
          {copiada ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copiada ? "Copiada" : "Copiar"}
        </Button>
      </div>
      {falhaAoCopiar && (
        <p role="alert" className="text-sm font-medium text-destructive">
          Não foi possível copiar automaticamente. Selecione a senha e copie manualmente.
        </p>
      )}

      <p role="note" className="flex items-start gap-2 rounded-xl bg-status-warning-bg p-3 text-sm text-status-warning-fg">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Anote agora: ela não aparece de novo. Se perder, gere uma nova senha.
      </p>

      <div className="flex justify-end">
        <Button onClick={onFechar}>Já anotei, fechar</Button>
      </div>
    </div>
  );
}
