"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MensagemErro } from "@/components/ui/mensagem-erro";
import { Opcional } from "@/components/ui/opcional";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { useCreateDepartamento, useSalvarMatriz, useUpdateDepartamento } from "../hooks/use-equipe";
import { departamentoSchema, type DepartamentoForm } from "../schema";
import type { Departamento, Modulo } from "../types";
import { MatrizPermissoesCampos, niveisIniciais, type NiveisPorModulo } from "./matriz-permissoes-campos";

function Formulario({ departamento, modulos, onFechar }: { departamento: Departamento | null; modulos: Modulo[]; onFechar: VoidFunction }) {
  const criar = useCreateDepartamento();
  const atualizar = useUpdateDepartamento();
  const salvarMatriz = useSalvarMatriz();
  const [niveis, setNiveis] = useState<NiveisPorModulo>(() => niveisIniciais(modulos, departamento?.permissoes ?? []));
  // Se criar der certo mas salvar as permissões falhar, a nova tentativa edita em vez de criar de novo.
  const [criadoId, setCriadoId] = useState<string | null>(null);
  const { toast } = useToast();
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartamentoForm>({
    resolver: zodResolver(departamentoSchema),
    defaultValues: { nome: departamento?.nome ?? "", descricao: departamento?.descricao ?? "" },
  });

  async function onSubmit(valores: DepartamentoForm) {
    setErroServidor(null);
    const input = { nome: valores.nome, descricao: valores.descricao || null };
    const permissoes = modulos.map((m) => ({ moduloId: m.id, nivel: niveis[m.id] ?? null }));
    const idExistente = departamento?.id ?? criadoId;
    try {
      let id: string;
      if (idExistente) {
        await atualizar.mutateAsync({ id: idExistente, input });
        id = idExistente;
      } else {
        id = (await criar.mutateAsync(input)).id;
        setCriadoId(id);
      }
      await salvarMatriz.mutateAsync({ id, permissoes });
      toast({ tipo: "sucesso", titulo: idExistente ? "Departamento atualizado!" : "Departamento criado!", descricao: valores.nome });
      onFechar();
    } catch (e) {
      setErroServidor(mensagemDeErroDaApi(e, "Não foi possível salvar o departamento. Tente novamente."));
    }
  }

  const salvando = criar.isPending || atualizar.isPending || salvarMatriz.isPending;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="departamento-nome" required>
          Nome
        </Label>
        <Input id="departamento-nome" autoComplete="off" hasError={!!errors.nome} {...register("nome")} />
        <MensagemErro id="departamento-nome-erro" mensagem={errors.nome?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="departamento-descricao">
          Descrição <Opcional />
        </Label>
        <Textarea id="departamento-descricao" rows={3} {...register("descricao")} />
        <MensagemErro id="departamento-descricao-erro" mensagem={errors.descricao?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Permissões</Label>
        <p className="text-sm text-muted-foreground">O que as pessoas deste departamento podem fazer em cada módulo.</p>
        <MatrizPermissoesCampos modulos={modulos} niveis={niveis} onChange={setNiveis} disabled={salvando} />
      </div>
      {erroServidor && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {erroServidor}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onFechar} disabled={salvando}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

interface DepartamentoFormDialogProps {
  aberto: boolean;
  /** Sem departamento: cria um novo; com ele: renomeia/edita a descrição. */
  departamento: Departamento | null;
  modulos: Modulo[];
  onFechar: VoidFunction;
}

export function DepartamentoFormDialog({ aberto, departamento, modulos, onFechar }: DepartamentoFormDialogProps) {
  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && onFechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{departamento ? "Editar departamento" : "Novo departamento"}</DialogTitle>
          <DialogDescription>
            {departamento ? "Mude o nome, a descrição ou o que o departamento acessa." : "Defina o nome e o que o departamento pode acessar."}
          </DialogDescription>
        </DialogHeader>
        {aberto && <Formulario key={departamento?.id ?? "novo"} departamento={departamento} modulos={modulos} onFechar={onFechar} />}
      </DialogContent>
    </Dialog>
  );
}
