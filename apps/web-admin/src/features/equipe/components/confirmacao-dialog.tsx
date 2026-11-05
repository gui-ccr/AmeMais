"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ConfirmacaoDialogProps {
  aberto: boolean;
  titulo: string;
  descricao: string;
  rotuloConfirmar: string;
  /** Erro da última tentativa (ex.: 409 da regra anti-trava), mostrado dentro do próprio diálogo. */
  erro?: string | null;
  processando?: boolean;
  onConfirmar: VoidFunction;
  onCancelar: VoidFunction;
}

/** Confirmação antes de uma ação difícil de desfazer (desativar membro, nova senha, apagar departamento). */
export function ConfirmacaoDialog({
  aberto,
  titulo,
  descricao,
  rotuloConfirmar,
  erro,
  processando,
  onConfirmar,
  onCancelar,
}: ConfirmacaoDialogProps) {
  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && !processando && onCancelar()}>
      <DialogContent className="max-w-md" role="alertdialog">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        {erro && (
          <p role="alert" className="mb-4 text-sm font-medium text-destructive">
            {erro}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancelar} disabled={processando}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirmar} disabled={processando}>
            {processando ? "Aguarde..." : rotuloConfirmar}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
