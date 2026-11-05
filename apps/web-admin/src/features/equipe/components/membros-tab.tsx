"use client";

import { AlertTriangle, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { useGerarSenhaProvisoria, useMembros, useUpdateAtivo } from "../hooks/use-equipe";
import type { Membro } from "../types";
import { ConfirmacaoDialog } from "./confirmacao-dialog";
import { MembroDepartamentosDialog } from "./membro-departamentos-dialog";
import { NovoMembroDialog } from "./novo-membro-dialog";
import { SenhaProvisoriaPainel } from "./senha-provisoria-painel";

type Acao = { tipo: "desativar" | "reativar" | "senha"; membro: Membro };

function formatarUltimoAcesso(iso: string | null): string {
  return iso ? `Último acesso em ${new Date(iso).toLocaleDateString("pt-BR")}` : "Nunca acessou";
}

function MembroItem({ membro, onDepartamentos, onAcao }: { membro: Membro; onDepartamentos: VoidFunction; onAcao: (tipo: Acao["tipo"]) => void }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words font-semibold text-foreground">{membro.nome}</h3>
          <p className="truncate text-sm text-muted-dark">{membro.email}</p>
        </div>
        <Badge variant={membro.ativo ? "success" : "muted"} size="sm">
          {membro.ativo ? "Ativo" : "Desativado"}
        </Badge>
      </div>

      {membro.departamentos.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Departamentos">
          {membro.departamentos.map((departamento) => (
            <li key={departamento.id}>
              <Badge variant="outline" size="sm">
                {departamento.nome}
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Sem departamento: sem acesso a nenhum módulo.</p>
      )}

      <p className="text-xs text-muted-foreground">{formatarUltimoAcesso(membro.ultimoAcesso)}</p>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onDepartamentos}>
          Editar departamentos
        </Button>
        <Button size="sm" variant="outline" onClick={() => onAcao("senha")}>
          Gerar nova senha
        </Button>
        {membro.ativo ? (
          <Button size="sm" variant="outline" onClick={() => onAcao("desativar")}>
            Desativar acesso
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onAcao("reativar")}>
            Reativar acesso
          </Button>
        )}
      </div>
    </Card>
  );
}

const TEXTOS: Record<Acao["tipo"], { titulo: string; confirmar: string; descricao: (nome: string) => string }> = {
  desativar: {
    titulo: "Desativar este acesso?",
    confirmar: "Desativar",
    descricao: (nome) => `${nome} não poderá mais entrar no painel. Os dados dela são mantidos e você pode reativar depois. Quem já está com a tela aberta pode continuar por até 1 hora.`,
  },
  reativar: {
    titulo: "Reativar este acesso?",
    confirmar: "Reativar",
    descricao: (nome) => `${nome} voltará a poder entrar no painel com a senha atual.`,
  },
  senha: {
    titulo: "Gerar uma nova senha?",
    confirmar: "Gerar nova senha",
    descricao: (nome) => `A senha atual de ${nome} deixa de funcionar. A nova senha será mostrada uma única vez e a pessoa terá de trocá-la no próximo acesso.`,
  },
};

/** Aba Membros: lista com busca, adicionar, editar departamentos, desativar/reativar e nova senha. */
export function MembrosTab() {
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const { data: membros, isPending, isError, error, refetch, isRefetching } = useMembros(buscaAplicada);
  const atualizarAtivo = useUpdateAtivo();
  const gerarSenha = useGerarSenhaProvisoria();
  const { toast } = useToast();

  const [adicionando, setAdicionando] = useState(false);
  const [editando, setEditando] = useState<Membro | null>(null);
  const [acao, setAcao] = useState<Acao | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [senhaGerada, setSenhaGerada] = useState<{ para: string; senha: string } | null>(null);

  // A busca vai para o servidor: espera a pessoa parar de digitar.
  useEffect(() => {
    const timer = setTimeout(() => setBuscaAplicada(busca), 300);
    return () => clearTimeout(timer);
  }, [busca]);

  function cancelarAcao() {
    setAcao(null);
    setErroAcao(null);
  }

  async function confirmarAcao() {
    if (!acao) return;
    setErroAcao(null);
    try {
      if (acao.tipo === "senha") {
        const senha = await gerarSenha.mutateAsync(acao.membro.id);
        setSenhaGerada({ para: acao.membro.nome, senha });
      } else {
        const ativo = acao.tipo === "reativar";
        await atualizarAtivo.mutateAsync({ id: acao.membro.id, ativo });
        toast({ tipo: "sucesso", titulo: ativo ? "Acesso reativado!" : "Acesso desativado!", descricao: acao.membro.nome });
      }
      setAcao(null);
    } catch (e) {
      setErroAcao(mensagemDeErroDaApi(e, "Não foi possível concluir a ação. Tente novamente."));
    }
  }

  const textos = acao ? TEXTOS[acao.tipo] : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-dark" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Buscar por nome ou e-mail"
            placeholder="Buscar por nome ou e-mail"
            className="pl-9"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
          />
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setAdicionando(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Novo membro
        </Button>
      </div>

      {isPending ? (
        <p aria-busy="true" className="text-sm text-muted-foreground">
          Carregando membros...
        </p>
      ) : isError ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-destructive/40 bg-destructive/5 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
          <p className="text-sm font-medium text-destructive">{mensagemDeErroDaApi(error, "Não foi possível carregar os membros. Tente novamente.")}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            {isRefetching ? "Tentando..." : "Tentar novamente"}
          </Button>
        </div>
      ) : membros.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-border-subtle bg-card-muted p-8 text-center text-sm text-muted-foreground">
          {buscaAplicada ? "Nenhum membro encontrado para esta busca." : "Nenhum membro cadastrado."}
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {membros.length} {membros.length === 1 ? "membro" : "membros"}
          </p>
          <ul className="grid gap-3 lg:grid-cols-2">
            {membros.map((membro) => (
              <li key={membro.id}>
                <MembroItem
                  membro={membro}
                  onDepartamentos={() => setEditando(membro)}
                  onAcao={(tipo) => setAcao({ tipo, membro })}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <NovoMembroDialog aberto={adicionando} onFechar={() => setAdicionando(false)} />
      <MembroDepartamentosDialog membro={editando} onFechar={() => setEditando(null)} />

      <ConfirmacaoDialog
        aberto={acao !== null}
        titulo={textos?.titulo ?? ""}
        descricao={acao && textos ? textos.descricao(acao.membro.nome) : ""}
        rotuloConfirmar={textos?.confirmar ?? ""}
        erro={erroAcao}
        processando={atualizarAtivo.isPending || gerarSenha.isPending}
        onConfirmar={confirmarAcao}
        onCancelar={cancelarAcao}
      />

      <Dialog open={senhaGerada !== null} onOpenChange={(abrir) => !abrir && setSenhaGerada(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova senha gerada</DialogTitle>
            <DialogDescription>A senha anterior deixou de funcionar.</DialogDescription>
          </DialogHeader>
          {senhaGerada && <SenhaProvisoriaPainel para={senhaGerada.para} senha={senhaGerada.senha} onFechar={() => setSenhaGerada(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
