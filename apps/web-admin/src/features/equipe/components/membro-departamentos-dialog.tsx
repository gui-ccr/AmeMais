"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { useUpdateDepartamentosDoMembro } from "../hooks/use-equipe";
import type { Membro } from "../types";
import { DepartamentosChecklist } from "./departamentos-checklist";

function Conteudo({ membro, onFechar }: { membro: Membro; onFechar: VoidFunction }) {
  const atualizar = useUpdateDepartamentosDoMembro();
  const { toast } = useToast();
  const [selecionados, setSelecionados] = useState(membro.departamentos.map((d) => d.id));
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    setErro(null);
    try {
      await atualizar.mutateAsync({ id: membro.id, departamentoIds: selecionados });
      toast({ tipo: "sucesso", titulo: "Departamentos atualizados!", descricao: membro.nome });
      onFechar();
    } catch (e) {
      // 409 = anti-trava (ex.: tirar o próprio acesso de administrador); a mensagem vem do servidor.
      setErro(mensagemDeErroDaApi(e, "Não foi possível salvar os departamentos. Tente novamente."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <DepartamentosChecklist selecionados={selecionados} onChange={setSelecionados} disabled={atualizar.isPending} />
      {erro && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {erro}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onFechar} disabled={atualizar.isPending}>
          Cancelar
        </Button>
        <Button onClick={salvar} disabled={atualizar.isPending}>
          {atualizar.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}

/** Troca os departamentos de um membro (o que ele pode acessar vem da matriz de cada departamento). */
export function MembroDepartamentosDialog({ membro, onFechar }: { membro: Membro | null; onFechar: VoidFunction }) {
  return (
    <Dialog open={membro !== null} onOpenChange={(abrir) => !abrir && onFechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Departamentos</DialogTitle>
          <DialogDescription>{membro?.nome}</DialogDescription>
        </DialogHeader>
        {membro && <Conteudo key={membro.id} membro={membro} onFechar={onFechar} />}
      </DialogContent>
    </Dialog>
  );
}
