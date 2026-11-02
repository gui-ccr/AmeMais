"use client";

import { AlertTriangle, Cat, Dog, Home, MapPin, Pencil, Phone } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { useLar } from "../hooks/use-lares";
import { STATUS_LAR_INFO } from "../opcoes";
import type { LarDetalhe as LarDetalheModelo } from "../types";
import { LarForm } from "./lar-form";

/** "2 / 5" — quantos animais moram no lar e quantos ele comporta. */
export function rotuloDeOcupacao(lar: Pick<LarDetalheModelo, "ocupacao" | "capacidade">): string {
  return `${lar.ocupacao} / ${lar.capacidade}`;
}

function Dado({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{rotulo}</dt>
      <dd className="break-words text-sm text-foreground">{children}</dd>
    </div>
  );
}

function DadosDoLar({ lar, onEditar }: { lar: LarDetalheModelo; onEditar: VoidFunction }) {
  const status = STATUS_LAR_INFO[lar.status];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant={status.variante}>{status.rotulo}</Badge>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onEditar}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Editar
        </Button>
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Dado rotulo="Responsável">{lar.nomeResponsavel}</Dado>
        <Dado rotulo="Contato">
          <span className="inline-flex items-center gap-1.5">
            <Phone className="h-4 w-4 shrink-0 text-muted-dark" aria-hidden="true" />
            {lar.contato}
          </span>
        </Dado>
        <Dado rotulo="Região">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-muted-dark" aria-hidden="true" />
            {lar.enderecoRegiao || "Não informada"}
          </span>
        </Dado>
        <Dado rotulo="Ocupação">
          <span className="inline-flex items-center gap-1.5">
            <Home className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
            <strong>{rotuloDeOcupacao(lar)}</strong> animais
          </span>
        </Dado>
        <Dado rotulo="Aceita">
          <span className="flex flex-wrap gap-3">
            {lar.aceitaGatos && (
              <span className="inline-flex items-center gap-1.5">
                <Cat className="h-4 w-4" aria-hidden="true" /> Gatos
              </span>
            )}
            {lar.aceitaCachorros && (
              <span className="inline-flex items-center gap-1.5">
                <Dog className="h-4 w-4" aria-hidden="true" /> Cachorros
              </span>
            )}
            {!lar.aceitaGatos && !lar.aceitaCachorros && <span className="text-muted-foreground">Não informado</span>}
          </span>
        </Dado>
        <Dado rotulo="Voluntário responsável">
          {lar.voluntario ? lar.voluntario.nome : <span className="text-muted-foreground">Nenhum vinculado</span>}
        </Dado>
        <div className="sm:col-span-2">
          <Dado rotulo="Observações">
            {lar.observacoes ? (
              <span className="whitespace-pre-line">{lar.observacoes}</span>
            ) : (
              <span className="text-muted-foreground">Sem observações</span>
            )}
          </Dado>
        </div>
      </dl>
    </div>
  );
}

interface LarDetalheProps {
  larId: string;
  onFechar: VoidFunction;
}

/**
 * Conteúdo do modal de detalhes de um lar: os dados e, ao clicar em "Editar", o mesmo formulário
 * do cadastro. Quem renderiza coloca isto dentro de um `DialogContent`.
 */
export function LarDetalhe({ larId, onFechar }: LarDetalheProps) {
  const { data: lar, isPending, isError, error, refetch, isRefetching } = useLar(larId);
  const [editando, setEditando] = useState(false);

  if (isPending || isError) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Lar temporário</DialogTitle>
          <DialogDescription className="sr-only">Detalhes do lar</DialogDescription>
        </DialogHeader>
        {isPending ? (
          <div className="flex animate-pulse flex-col gap-3" aria-busy="true" aria-label="Carregando lar">
            <div className="h-5 w-1/3 rounded bg-card-muted" />
            <div className="h-4 w-2/3 rounded bg-card-muted" />
            <div className="h-4 w-1/2 rounded bg-card-muted" />
          </div>
        ) : (
          <div role="alert" className="flex flex-col items-center gap-3 p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
            <p className="text-sm font-medium text-destructive">
              {mensagemDeErroDaApi(error, "Não foi possível carregar o lar. Tente novamente.")}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
                {isRefetching ? "Tentando..." : "Tentar novamente"}
              </Button>
              <Button variant="ghost" size="sm" onClick={onFechar}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editando ? "Editar lar" : `Lar de ${lar.nomeResponsavel}`}</DialogTitle>
        <DialogDescription>
          {editando ? "Corrija os dados do lar." : "Dados do lar, ocupação e animais que moram nele."}
        </DialogDescription>
      </DialogHeader>

      {editando ? (
        // `key`: ao reabrir a edição depois de salvar, o formulário parte dos dados novos.
        <LarForm key={lar.id} lar={lar} onFechar={() => setEditando(false)} />
      ) : (
        <DadosDoLar lar={lar} onEditar={() => setEditando(true)} />
      )}
    </>
  );
}
