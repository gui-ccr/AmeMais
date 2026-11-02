"use client";

import { useId, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { useUpdateLarStatus } from "../hooks/use-lares";
import { STATUS_LAR_INFO, transicoesPermitidas } from "../opcoes";
import type { StatusLar } from "../types";

interface LarStatusSelectProps {
  larId: string;
  statusAtual: StatusLar;
}

/**
 * Troca o status do lar. Só oferece os destinos que a matriz de transições permite a partir
 * do status atual. Se a API recusar (ex.: inativar lar com animais), mostra a mensagem dela e o
 * lar continua no status anterior — o seletor não guarda o valor escolhido, quem manda é o
 * `statusAtual` que vem do servidor.
 */
export function LarStatusSelect({ larId, statusAtual }: LarStatusSelectProps) {
  const id = useId();
  const { toast } = useToast();
  const atualizarStatus = useUpdateLarStatus();
  const [erro, setErro] = useState<string | null>(null);

  async function trocar(novo: string) {
    setErro(null);
    try {
      await atualizarStatus.mutateAsync({ id: larId, status: novo as StatusLar });
      toast({ tipo: "sucesso", titulo: `Status alterado para ${STATUS_LAR_INFO[novo as StatusLar].rotulo}` });
    } catch (e) {
      setErro(mensagemDeErroDaApi(e, "Não foi possível alterar o status. O lar continua como estava."));
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id} size="sm">
        Alterar status
      </Label>
      {/* `value=""`: o seletor sempre mostra o placeholder; o status atual aparece na etiqueta ao lado. */}
      <Select value="" onValueChange={trocar} disabled={atualizarStatus.isPending}>
        <SelectTrigger id={id} selectSize="sm" variant="outline" hasError={!!erro} className="min-w-48">
          <SelectValue placeholder={atualizarStatus.isPending ? "Alterando..." : "Mudar para..."} />
        </SelectTrigger>
        <SelectContent>
          {transicoesPermitidas(statusAtual).map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LAR_INFO[status].rotulo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {erro && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
