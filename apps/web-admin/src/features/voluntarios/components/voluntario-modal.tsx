"use client";

import { isAxiosError } from "axios";
import { Home, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { useRemoveVoluntario, useUpdateVoluntarioStatus, useVoluntarios } from "../hooks/use-voluntarios";
import { AREA_DE_AJUDA_INFO, STATUS_VOLUNTARIO_INFO, TIPO_VOLUNTARIO_INFO } from "../opcoes";
import type { VoluntarioDetalhe } from "../types";
import { VoluntarioForm } from "./voluntario-form";

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{rotulo}</dt>
      <dd className="break-words text-foreground">{children}</dd>
    </div>
  );
}

const NAO_INFORMADO = <span className="text-muted-foreground">Não informado</span>;

/** Quando o lar abre: `/admin/lares?lar=<id>` (a tela de lares abre o detalhe a partir desse parâmetro). */
export function hrefDoLar(larId: string): string {
  return `/admin/lares?lar=${encodeURIComponent(larId)}`;
}

interface VoluntarioDetalhesProps {
  voluntario: VoluntarioDetalhe;
  onEditar: VoidFunction;
  onFechar: VoidFunction;
}

/** Dados completos de um voluntário e o lar temporário ligado a ele (link para a tela de lares). */
export function VoluntarioDetalhes({ voluntario, onEditar, onFechar }: VoluntarioDetalhesProps) {
  const status = STATUS_VOLUNTARIO_INFO[voluntario.status];
  const lar = voluntario.larTemporario;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="neutral" size="sm">
          {TIPO_VOLUNTARIO_INFO[voluntario.tipo].rotulo}
        </Badge>
        <Badge variant={status.variante} size="sm">
          {status.rotulo}
        </Badge>
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo rotulo="Telefone ou WhatsApp">
          {voluntario.telefone ? (
            <a
              href={`tel:${voluntario.telefone.replace(/\D/g, "")}`}
              className="inline-flex items-center gap-1.5 hover:text-primary hover:underline"
            >
              <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
              {voluntario.telefone}
            </a>
          ) : (
            NAO_INFORMADO
          )}
        </Campo>
        <Campo rotulo="E-mail">
          {voluntario.email ? (
            <a
              href={`mailto:${voluntario.email}`}
              className="inline-flex min-w-0 items-center gap-1.5 hover:text-primary hover:underline"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{voluntario.email}</span>
            </a>
          ) : (
            NAO_INFORMADO
          )}
        </Campo>
        <Campo rotulo="Bairro">{voluntario.bairro || NAO_INFORMADO}</Campo>
        <Campo rotulo="Cadastrado em">
          {voluntario.createdAt ? new Date(voluntario.createdAt).toLocaleDateString("pt-BR") : NAO_INFORMADO}
        </Campo>
      </dl>

      <section aria-label="Como quer ajudar" className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Como quer ajudar</h3>
        {voluntario.areasDeAjuda.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {voluntario.areasDeAjuda.map((area) => (
              <li key={area}>
                <Badge variant="outline" size="sm">
                  {AREA_DE_AJUDA_INFO[area].rotulo}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma área de ajuda informada.</p>
        )}
      </section>

      <section
        aria-label="Lar temporário"
        className="flex flex-col gap-2 rounded-xl border-2 border-border-subtle bg-card-muted p-3.5"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lar temporário</h3>
        {lar ? (
          <Link
            href={hrefDoLar(lar.id)}
            className="inline-flex w-fit items-center gap-1.5 font-medium text-foreground hover:text-primary hover:underline"
          >
            <Home className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
            {lar.enderecoRegiao || "Endereço não informado"}
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">Este voluntário não tem lar temporário vinculado.</p>
        )}
      </section>

      <AcoesDoVoluntario voluntario={voluntario} onEditar={onEditar} onFechar={onFechar} />
    </div>
  );
}

const MENSAGEM_LAR_VINCULADO =
  "Este voluntário tem um lar temporário vinculado e não pode ser removido. Inative-o em vez de remover.";

/** Mensagem do erro ao remover. O 409 é sempre "tem lar vinculado": sugere inativar. */
export function erroAoRemover(erro: unknown): string {
  if (isAxiosError(erro) && erro.response?.status === 409) {
    return mensagemDeErroDaApi(erro, MENSAGEM_LAR_VINCULADO);
  }
  return mensagemDeErroDaApi(erro, "Não foi possível remover o voluntário. Tente novamente.");
}

type Confirmacao = "status" | "remover";

/**
 * Botões do rodapé dos detalhes: Fechar, Editar, Inativar/Ativar e Remover. Inativar/Ativar e
 * Remover pedem confirmação no próprio modal. Remover fica desabilitado enquanto houver lar
 * vinculado (a API também recusa com 409): nesse caso o caminho é inativar.
 */
function AcoesDoVoluntario({ voluntario, onEditar, onFechar }: VoluntarioDetalhesProps) {
  const alterarStatus = useUpdateVoluntarioStatus();
  const removerVoluntario = useRemoveVoluntario();
  const { toast } = useToast();
  const [confirmando, setConfirmando] = useState<Confirmacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const ativo = voluntario.status === "ativo";
  const temLar = !!voluntario.larTemporario;
  const processando = alterarStatus.isPending || removerVoluntario.isPending;

  function cancelar() {
    setConfirmando(null);
    setErro(null);
  }

  async function confirmarStatus() {
    setErro(null);
    try {
      await alterarStatus.mutateAsync({ id: voluntario.id, status: ativo ? "inativo" : "ativo" });
      toast({
        tipo: "sucesso",
        titulo: ativo ? "Voluntário inativado!" : "Voluntário ativado!",
        descricao: voluntario.nome,
      });
      setConfirmando(null);
    } catch (e) {
      setErro(mensagemDeErroDaApi(e, "Não foi possível alterar o status do voluntário. Tente novamente."));
    }
  }

  async function confirmarRemocao() {
    setErro(null);
    try {
      await removerVoluntario.mutateAsync(voluntario.id);
      toast({ tipo: "sucesso", titulo: "Voluntário removido!", descricao: voluntario.nome });
      onFechar();
    } catch (e) {
      setErro(erroAoRemover(e));
    }
  }

  if (confirmando) {
    const removendo = confirmando === "remover";
    return (
      <div
        role="alertdialog"
        aria-labelledby="voluntario-confirmacao-titulo"
        aria-describedby="voluntario-confirmacao-texto"
        className="flex flex-col gap-3 rounded-xl border-2 border-destructive/40 bg-destructive/5 p-4"
      >
        <h3 id="voluntario-confirmacao-titulo" className="font-semibold text-foreground">
          {removendo ? "Remover este voluntário?" : ativo ? "Inativar este voluntário?" : "Ativar este voluntário?"}
        </h3>
        <p id="voluntario-confirmacao-texto" className="text-sm text-muted-dark">
          {removendo
            ? `${voluntario.nome} será apagado da rede de voluntários. Essa ação não pode ser desfeita. Se a pessoa só saiu da ONG, prefira inativar: o cadastro fica no histórico.`
            : ativo
              ? `${voluntario.nome} continua cadastrado, mas passa a constar como inativo. O lar temporário vinculado não muda.`
              : `${voluntario.nome} volta a constar como voluntário ativo.`}
        </p>
        {erro && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {erro}
          </p>
        )}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={cancelar} disabled={processando}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant={removendo ? "destructive" : "default"}
            onClick={removendo ? confirmarRemocao : confirmarStatus}
            disabled={processando}
          >
            {processando
              ? "Aguarde..."
              : removendo
                ? "Sim, remover"
                : ativo
                  ? "Sim, inativar"
                  : "Sim, ativar"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {temLar && (
        <p id="voluntario-remover-ajuda" className="text-sm text-muted-foreground">
          Não é possível remover enquanto houver lar temporário vinculado. Para quem saiu da ONG, use
          &quot;Inativar&quot;: o cadastro fica no histórico.
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => setConfirmando("status")}>
            {ativo ? "Inativar" : "Ativar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-destructive text-destructive"
            disabled={temLar}
            aria-describedby={temLar ? "voluntario-remover-ajuda" : undefined}
            onClick={() => setConfirmando("remover")}
          >
            Remover
          </Button>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button type="button" variant="outline" onClick={onFechar}>
            Fechar
          </Button>
          <Button type="button" onClick={onEditar}>
            Editar
          </Button>
        </div>
      </div>
    </div>
  );
}

interface VoluntarioModalProps {
  voluntarioId: string;
  onFechar: VoidFunction;
}

/**
 * Conteúdo do modal que abre ao clicar num voluntário: os detalhes e, ao clicar em "Editar",
 * o mesmo formulário do cadastro com os dados preenchidos. Lê o voluntário da lista (e não de uma
 * cópia), então depois de salvar mostra os dados já atualizados.
 */
export function VoluntarioModal({ voluntarioId, onFechar }: VoluntarioModalProps) {
  const { data: voluntarios } = useVoluntarios();
  const [editando, setEditando] = useState(false);
  // Guarda o último voluntário visto: se ele sair da lista (removido) enquanto o modal fecha, não pisca "não encontrado".
  const ultimoVisto = useRef<VoluntarioDetalhe | null>(null);
  const encontrado = voluntarios?.find((item) => item.id === voluntarioId);
  if (encontrado) ultimoVisto.current = encontrado;
  const voluntario = encontrado ?? ultimoVisto.current;

  if (!voluntario) {
    return (
      <div className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Voluntário não encontrado</DialogTitle>
          <DialogDescription>Ele pode ter sido removido. Feche e confira a lista.</DialogDescription>
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
        <DialogTitle>{editando ? "Editar voluntário" : voluntario.nome}</DialogTitle>
        <DialogDescription>
          {editando ? "Altere o que precisar e salve." : "Dados do voluntário e o lar temporário ligado a ele."}
        </DialogDescription>
      </DialogHeader>
      {editando ? (
        <VoluntarioForm voluntario={voluntario} onFechar={() => setEditando(false)} />
      ) : (
        <VoluntarioDetalhes voluntario={voluntario} onEditar={() => setEditando(true)} onFechar={onFechar} />
      )}
    </>
  );
}
