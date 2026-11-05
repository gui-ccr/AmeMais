"use client";

import { AlertTriangle, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { useDepartamentosEModulos, useRemoveDepartamento } from "../hooks/use-equipe";
import type { Departamento, Modulo } from "../types";
import { ConfirmacaoDialog } from "./confirmacao-dialog";
import { DepartamentoFormDialog } from "./departamento-form-dialog";

function resumoDeAcesso(departamento: Departamento, modulos: Modulo[]) {
  const nomeDoModulo = new Map(modulos.map((m) => [m.id, m.nome]));
  return departamento.permissoes
    .filter((p) => p.nivel !== null)
    .map((p) => ({ id: p.moduloId, nome: nomeDoModulo.get(p.moduloId) ?? "Módulo", nivel: p.nivel }));
}

function DepartamentoItem({
  departamento,
  modulos,
  onEditar,
  onRemover,
}: {
  departamento: Departamento;
  modulos: Modulo[];
  onEditar: VoidFunction;
  onRemover: VoidFunction;
}) {
  const acessos = resumoDeAcesso(departamento, modulos);
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words font-semibold text-foreground">{departamento.nome}</h3>
          {departamento.descricao && <p className="text-sm text-muted-dark">{departamento.descricao}</p>}
        </div>
        <Badge variant="neutral" size="sm">
          {departamento.totalMembros} {departamento.totalMembros === 1 ? "membro" : "membros"}
        </Badge>
      </div>

      {acessos.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Acessos do departamento">
          {acessos.map((acesso) => (
            <li key={acesso.id}>
              <Badge variant={acesso.nivel === "total" ? "success" : "outline"} size="sm">
                {acesso.nome} · {acesso.nivel === "total" ? "edita" : "consulta"}
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Sem acesso a nenhum módulo.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onEditar}>
          Editar
        </Button>
        <Button size="sm" variant="outline" onClick={onRemover}>
          Apagar
        </Button>
      </div>
    </Card>
  );
}

/** Aba Departamentos: criar, editar, apagar e definir a matriz de permissões de cada um. */
export function DepartamentosTab() {
  const { data, isPending, isError, error, refetch, isRefetching } = useDepartamentosEModulos();
  const remover = useRemoveDepartamento();
  const { toast } = useToast();

  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Departamento | null>(null);
  const [apagando, setApagando] = useState<Departamento | null>(null);
  const [erroApagar, setErroApagar] = useState<string | null>(null);

  function abrirForm(departamento: Departamento | null) {
    setEditando(departamento);
    setFormAberto(true);
  }

  async function confirmarApagar() {
    if (!apagando) return;
    setErroApagar(null);
    try {
      await remover.mutateAsync(apagando.id);
      toast({ tipo: "sucesso", titulo: "Departamento apagado!", descricao: apagando.nome });
      setApagando(null);
    } catch (e) {
      setErroApagar(mensagemDeErroDaApi(e, "Não foi possível apagar o departamento. Tente novamente."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button className="gap-2 shrink-0" onClick={() => abrirForm(null)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Novo departamento
        </Button>
      </div>

      {isPending ? (
        <p aria-busy="true" className="text-sm text-muted-foreground">
          Carregando departamentos...
        </p>
      ) : isError ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-destructive/40 bg-destructive/5 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
          <p className="text-sm font-medium text-destructive">{mensagemDeErroDaApi(error, "Não foi possível carregar os departamentos. Tente novamente.")}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            {isRefetching ? "Tentando..." : "Tentar novamente"}
          </Button>
        </div>
      ) : data.departamentos.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-border-subtle bg-card-muted p-8 text-center text-sm text-muted-foreground">
          Nenhum departamento cadastrado.
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {data.departamentos.map((departamento) => (
            <li key={departamento.id}>
              <DepartamentoItem
                departamento={departamento}
                modulos={data.modulos}
                onEditar={() => abrirForm(departamento)}
                onRemover={() => setApagando(departamento)}
              />
            </li>
          ))}
        </ul>
      )}

      <DepartamentoFormDialog aberto={formAberto} departamento={editando} modulos={data?.modulos ?? []} onFechar={() => setFormAberto(false)} />
      <ConfirmacaoDialog
        aberto={apagando !== null}
        titulo="Apagar este departamento?"
        descricao={
          apagando
            ? `${apagando.nome} será removido e ${apagando.totalMembros} ${apagando.totalMembros === 1 ? "pessoa perde" : "pessoas perdem"} os acessos que ele dava.`
            : ""
        }
        rotuloConfirmar="Apagar"
        erro={erroApagar}
        processando={remover.isPending}
        onConfirmar={confirmarApagar}
        onCancelar={() => {
          setApagando(null);
          setErroApagar(null);
        }}
      />
    </div>
  );
}
