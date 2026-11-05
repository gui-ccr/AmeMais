"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MensagemErro } from "@/components/ui/mensagem-erro";
import { Opcional } from "@/components/ui/opcional";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { useCreateMembro } from "../hooks/use-equipe";
import { novoMembroSchema, type NovoMembroForm } from "../schema";
import type { MembroComSenhaProvisoria } from "../types";
import { DepartamentosChecklist } from "./departamentos-checklist";
import { SenhaProvisoriaPainel } from "./senha-provisoria-painel";

function NovoMembroForm({ onCriado, onFechar }: { onCriado: (r: MembroComSenhaProvisoria) => void; onFechar: VoidFunction }) {
  const criar = useCreateMembro();
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NovoMembroForm>({
    resolver: zodResolver(novoMembroSchema),
    defaultValues: { nome: "", email: "", departamentoIds: [] },
  });

  async function onSubmit(valores: NovoMembroForm) {
    setErroServidor(null);
    try {
      onCriado(await criar.mutateAsync(valores));
    } catch (erro) {
      setErroServidor(mensagemDeErroDaApi(erro, "Não foi possível adicionar o membro. Tente novamente."));
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="membro-nome" required>
          Nome
        </Label>
        <Input id="membro-nome" autoComplete="off" hasError={!!errors.nome} {...register("nome")} />
        <MensagemErro id="membro-nome-erro" mensagem={errors.nome?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="membro-email" required>
          E-mail
        </Label>
        <Input id="membro-email" type="email" autoComplete="off" hasError={!!errors.email} {...register("email")} />
        <MensagemErro id="membro-email-erro" mensagem={errors.email?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>
          Departamentos <Opcional />
        </Label>
        <p className="text-sm text-muted-foreground">Sem escolher nenhum, a pessoa entra em “Voluntariado”.</p>
        <Controller
          control={control}
          name="departamentoIds"
          render={({ field }) => <DepartamentosChecklist selecionados={field.value} onChange={field.onChange} disabled={criar.isPending} />}
        />
      </div>
      {erroServidor && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {erroServidor}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onFechar} disabled={criar.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={criar.isPending}>
          {criar.isPending ? "Adicionando..." : "Adicionar membro"}
        </Button>
      </div>
    </form>
  );
}

/** Cadastro de membro: depois de criar, o mesmo diálogo passa a mostrar a senha provisória (uma vez). */
export function NovoMembroDialog({ aberto, onFechar }: { aberto: boolean; onFechar: VoidFunction }) {
  const [criado, setCriado] = useState<MembroComSenhaProvisoria | null>(null);

  function fechar() {
    setCriado(null);
    onFechar();
  }

  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && fechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{criado ? "Membro adicionado" : "Novo membro"}</DialogTitle>
          <DialogDescription>
            {criado
              ? "A conta já está ativa. Guarde a senha provisória abaixo."
              : "A conta é criada na hora, com uma senha provisória que será mostrada uma única vez."}
          </DialogDescription>
        </DialogHeader>
        {aberto &&
          (criado ? (
            <SenhaProvisoriaPainel para={criado.membro.nome} senha={criado.senhaProvisoria} onFechar={fechar} />
          ) : (
            <NovoMembroForm onCriado={setCriado} onFechar={fechar} />
          ))}
      </DialogContent>
    </Dialog>
  );
}
