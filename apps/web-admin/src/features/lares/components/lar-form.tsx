"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MensagemErro } from "@/components/ui/mensagem-erro";
import { Opcional } from "@/components/ui/opcional";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { formatPhone } from "@/utils";
import { useCreateLar, useUpdateLar } from "../hooks/use-lares";
import {
  LAR_FORM_VAZIO,
  larSchema,
  paraDadosDoLar,
  paraValoresDoFormulario,
  type LarFormEntrada,
  type LarFormSaida,
} from "../schema";
import type { Voluntario } from "@/features/voluntarios/types";
import type { LarDetalhe } from "../types";
import { LarVoluntarioBusca } from "./lar-voluntario-busca";

/**
 * Onde mostrar o erro ao salvar. Na edição, o 422 da API é a capacidade menor que a ocupação
 * (a única regra de negócio do `PUT /api/lares/:id`): vai para baixo do campo capacidade.
 * O resto (sem permissão, sem conexão, erro do servidor) aparece como erro geral do formulário.
 */
export function erroAoSalvarLar(
  erro: unknown,
  editando: boolean,
): { campo: "capacidade"; mensagem: string } | { campo: null; mensagem: string } {
  const mensagemPadrao = editando
    ? "Não foi possível salvar as alterações. Tente novamente."
    : "Não foi possível cadastrar o lar. Tente novamente.";
  const mensagem = mensagemDeErroDaApi(erro, mensagemPadrao);
  if (editando && isAxiosError(erro) && erro.response?.status === 422) {
    return { campo: "capacidade", mensagem };
  }
  return { campo: null, mensagem };
}

/** `aria-*` de um campo com a mensagem de erro dele, para o leitor de tela ligar os dois. */
function ariaDoCampo(id: string, temErro: boolean) {
  return { "aria-invalid": temErro || undefined, "aria-describedby": temErro ? `${id}-erro` : undefined };
}

interface LarFormProps {
  /** Sem `lar`, é o cadastro; com `lar`, é a edição desse lar. */
  lar?: LarDetalhe;
  onFechar: VoidFunction;
}

/** Cadastro e edição de lar (abre num modal). O status não é escolhido aqui: o lar nasce "disponível". */
export function LarForm({ lar, onFechar }: LarFormProps) {
  const editando = !!lar;
  const criarLar = useCreateLar();
  const editarLar = useUpdateLar();
  const { toast } = useToast();
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LarFormEntrada, unknown, LarFormSaida>({
    resolver: zodResolver(larSchema),
    defaultValues: lar ? paraValoresDoFormulario(lar) : LAR_FORM_VAZIO,
  });

  // Nome do voluntário escolhido (só para mostrar); o que vai para a API é o `voluntarioId` do formulário.
  const [voluntarioNome, setVoluntarioNome] = useState<string | null>(lar?.voluntario?.nome ?? null);
  const voluntarioId = watch("voluntarioId");

  /** Ao escolher um voluntário, responsável e contato vêm dele — e continuam editáveis. */
  function escolherVoluntario(voluntario: Voluntario) {
    setVoluntarioNome(voluntario.nome);
    setValue("voluntarioId", voluntario.id);
    setValue("nomeResponsavel", voluntario.nome, { shouldValidate: true });
    if (voluntario.telefone) setValue("contato", formatPhone(voluntario.telefone), { shouldValidate: true });
  }

  function limparVoluntario() {
    setVoluntarioNome(null);
    setValue("voluntarioId", null);
  }

  const salvando = criarLar.isPending || editarLar.isPending;

  async function onSubmit(valores: LarFormSaida) {
    setErroServidor(null);
    const dados = paraDadosDoLar(valores);
    try {
      if (lar) {
        await editarLar.mutateAsync({ id: lar.id, input: dados });
        toast({ tipo: "sucesso", titulo: "Lar atualizado com sucesso!" });
      } else {
        const novo = await criarLar.mutateAsync(dados);
        toast({
          tipo: "sucesso",
          titulo: "Lar cadastrado com sucesso!",
          descricao: `O lar de ${novo.nomeResponsavel} já aparece na lista.`,
        });
      }
      onFechar();
    } catch (erro) {
      const { campo, mensagem } = erroAoSalvarLar(erro, editando);
      if (campo) {
        setError(campo, { type: "server", message: mensagem });
        setFocus(campo);
      } else {
        setErroServidor(mensagem);
      }
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <LarVoluntarioBusca
        selecionado={voluntarioId ? { id: voluntarioId, nome: voluntarioNome ?? "Voluntário vinculado" } : null}
        onEscolher={escolherVoluntario}
        onLimpar={limparVoluntario}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lar-responsavel" required>
          Responsável
        </Label>
        <Input
          id="lar-responsavel"
          autoComplete="off"
          placeholder="Ex: Maria da Silva"
          hasError={!!errors.nomeResponsavel}
          {...ariaDoCampo("lar-responsavel", !!errors.nomeResponsavel)}
          {...register("nomeResponsavel")}
        />
        <MensagemErro id="lar-responsavel-erro" mensagem={errors.nomeResponsavel?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lar-contato" required>
          Telefone ou WhatsApp
        </Label>
        <Controller
          control={control}
          name="contato"
          render={({ field }) => (
            <Input
              id="lar-contato"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              maxLength={15}
              placeholder="(00) 00000-0000"
              hasError={!!errors.contato}
              {...ariaDoCampo("lar-contato", !!errors.contato)}
              value={field.value ?? ""}
              onBlur={field.onBlur}
              ref={field.ref}
              onChange={(evento) => field.onChange(formatPhone(evento.target.value))}
            />
          )}
        />
        <MensagemErro id="lar-contato-erro" mensagem={errors.contato?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lar-capacidade" required>
          Capacidade
        </Label>
        <Input
          id="lar-capacidade"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          autoComplete="off"
          placeholder="Quantos animais comporta"
          hasError={!!errors.capacidade}
          {...ariaDoCampo("lar-capacidade", !!errors.capacidade)}
          {...register("capacidade")}
        />
        <MensagemErro id="lar-capacidade-erro" mensagem={errors.capacidade?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lar-regiao" required>
          Região
        </Label>
        <Input
          id="lar-regiao"
          autoComplete="off"
          placeholder="Ex: Centro, Bairro São José"
          hasError={!!errors.enderecoRegiao}
          {...ariaDoCampo("lar-regiao", !!errors.enderecoRegiao)}
          {...register("enderecoRegiao")}
        />
        <MensagemErro id="lar-regiao-erro" mensagem={errors.enderecoRegiao?.message} />
      </div>

      <Controller
        control={control}
        name="aceitaGatos"
        render={({ field: gatos }) => (
          <Controller
            control={control}
            name="aceitaCachorros"
            render={({ field: cachorros }) => (
              <fieldset className="flex flex-col gap-2 md:col-span-2">
                <legend className="mb-1 text-base font-medium text-foreground">Animais que aceita</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    { rotulo: "Aceita gatos", campo: gatos },
                    { rotulo: "Aceita cachorros", campo: cachorros },
                  ].map(({ rotulo, campo }) => (
                    <label
                      key={rotulo}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-sm transition-colors focus-within:ring-2 focus-within:ring-primary",
                        campo.value ? "border-secondary bg-secondary/10 font-medium" : "border-border-subtle bg-card-muted",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 accent-secondary"
                        checked={!!campo.value}
                        onChange={(evento) => campo.onChange(evento.target.checked)}
                      />
                      {rotulo}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          />
        )}
      />

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="lar-observacoes">
          Observações <Opcional />
        </Label>
        <Textarea
          id="lar-observacoes"
          rows={3}
          placeholder="Ex: tem quintal fechado, não aceita filhotes"
          hasError={!!errors.observacoes}
          {...ariaDoCampo("lar-observacoes", !!errors.observacoes)}
          {...register("observacoes")}
        />
        <MensagemErro id="lar-observacoes-erro" mensagem={errors.observacoes?.message} />
      </div>

      {erroServidor && (
        <p role="alert" className="text-sm font-medium text-destructive md:col-span-2">
          {erroServidor}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end md:col-span-2">
        <Button type="button" variant="outline" onClick={onFechar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar lar"}
        </Button>
      </div>
    </form>
  );
}
