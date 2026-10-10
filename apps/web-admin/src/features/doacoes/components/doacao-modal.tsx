"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatarQuantidade } from "@/features/urgencias/opcoes";
import { formatISODateToBR } from "@/utils";
import { useDoacoes } from "../hooks/use-doacoes";
import { CATEGORIA_INFO, formatarDataHora } from "../opcoes";
import type { Doacao } from "../types";
import { DoacaoForm } from "./doacao-form";
import { UrgenciaResumo } from "./urgencia-resumo";

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{rotulo}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}

const NAO_INFORMADO = <span className="text-muted-foreground">Não informado</span>;

interface DoacaoDetalhesProps {
  doacao: Doacao;
  onEditar: VoidFunction;
  onFechar: VoidFunction;
}

/** Detalhes completos de uma doação, com a auditoria ("Registrado por") e o botão "Editar". */
export function DoacaoDetalhes({ doacao, onEditar, onFechar }: DoacaoDetalhesProps) {
  const temDoador = !!(doacao.doadorNome || doacao.doadorTelefone || doacao.doadorCpf);

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Campo rotulo="Descrição">{doacao.descricao}</Campo>
        </div>
        <Campo rotulo="Categoria">{CATEGORIA_INFO[doacao.categoria].rotulo}</Campo>
        <Campo rotulo="Quantidade">{formatarQuantidade(doacao.quantidade, doacao.unidade)}</Campo>
        <Campo rotulo="Data de entrada">{formatISODateToBR(doacao.dataEntrada)}</Campo>
        <Campo rotulo="Onde foi coletada">{doacao.localColeta}</Campo>
      </dl>

      {doacao.urlFoto && (
        // Foto vinda de uma URL qualquer (ou data URL, no mock): sem domínio fixo para o next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={doacao.urlFoto}
          alt={`Foto da doação: ${doacao.descricao}`}
          className="max-h-60 w-full rounded-xl border-2 border-border-subtle object-cover"
        />
      )}

      {doacao.urgenciaId && (
        <section aria-label="Urgência vinculada" className="flex flex-col gap-2 rounded-xl border-2 border-border-subtle bg-card-muted p-3.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Urgência vinculada</h3>
          <UrgenciaResumo urgenciaId={doacao.urgenciaId} />
        </section>
      )}

      <section aria-label="Doador" className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Doador</h3>
        {temDoador ? (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Campo rotulo="Nome">{doacao.doadorNome ?? NAO_INFORMADO}</Campo>
            <Campo rotulo="Telefone">{doacao.doadorTelefone ?? NAO_INFORMADO}</Campo>
            <Campo rotulo="CPF">{doacao.doadorCpf ?? NAO_INFORMADO}</Campo>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Doador não identificado.</p>
        )}
      </section>

      <p className="rounded-xl border-2 border-border-subtle bg-card-muted px-3.5 py-2.5 text-sm text-muted-dark">
        Registrado por: <strong className="text-foreground">{doacao.registradoPor}</strong>
        {formatarDataHora(doacao.createdAt) && <> · em {formatarDataHora(doacao.createdAt)}</>}
      </p>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onFechar}>
          Fechar
        </Button>
        <Button type="button" onClick={onEditar}>
          Editar
        </Button>
      </div>
    </div>
  );
}

interface DoacaoModalProps {
  doacaoId: string;
  onFechar: VoidFunction;
}

/**
 * Conteúdo do modal que abre ao clicar numa doação: os detalhes e, ao clicar em
 * "Editar", o mesmo formulário do cadastro com os dados preenchidos. Lê a doação da
 * lista (e não de uma cópia), então depois de salvar mostra os dados já atualizados.
 */
export function DoacaoModal({ doacaoId, onFechar }: DoacaoModalProps) {
  const { data: doacoes } = useDoacoes();
  const [editando, setEditando] = useState(false);
  const doacao = doacoes?.find((item) => item.id === doacaoId);

  if (!doacao) {
    return (
      <div className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Doação não encontrada</DialogTitle>
          <DialogDescription>Ela pode ter sido removida. Feche e confira a lista.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onFechar}>
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editando ? "Editar doação" : "Detalhes da doação"}</DialogTitle>
        <DialogDescription>
          {editando ? "Altere o que precisar e salve." : "Confira o registro completo e quem o cadastrou."}
        </DialogDescription>
      </DialogHeader>
      {editando ? (
        <DoacaoForm doacao={doacao} onFechar={() => setEditando(false)} />
      ) : (
        <DoacaoDetalhes doacao={doacao} onEditar={() => setEditando(true)} onFechar={onFechar} />
      )}
    </>
  );
}
