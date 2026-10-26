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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { formatPhone } from "@/utils";
import { useCreateVoluntario } from "../hooks/use-voluntarios";
import { AREA_DE_AJUDA_INFO, TIPO_VOLUNTARIO_INFO } from "../opcoes";
import {
  VOLUNTARIO_FORM_VAZIO,
  paraDadosDoVoluntario,
  voluntarioSchema,
  type VoluntarioFormEntrada,
  type VoluntarioFormSaida,
} from "../schema";
import { AREAS_DE_AJUDA, TIPOS_VOLUNTARIO } from "../types";

const MENSAGEM_PADRAO = "Não foi possível cadastrar o voluntário. Tente novamente.";

/**
 * Onde mostrar o erro do cadastro. O 409 da API é sempre e-mail repetido (único conflito
 * possível no `POST /api/voluntarios`), então vai para baixo do campo de e-mail; o resto
 * (sem permissão, sem conexão, erro do servidor) aparece como erro geral do formulário.
 */
export function erroDoCadastro(erro: unknown): { campo: "email"; mensagem: string } | { campo: null; mensagem: string } {
  if (isAxiosError(erro) && erro.response?.status === 409) {
    return { campo: "email", mensagem: mensagemDeErroDaApi(erro, "Já existe um voluntário cadastrado com este e-mail.") };
  }
  return { campo: null, mensagem: mensagemDeErroDaApi(erro, MENSAGEM_PADRAO) };
}

/** `aria-*` de um campo com a mensagem de erro dele, para o leitor de tela ligar os dois. */
function ariaDoCampo(id: string, temErro: boolean) {
  return { "aria-invalid": temErro || undefined, "aria-describedby": temErro ? `${id}-erro` : undefined };
}

interface VoluntarioFormProps {
  onFechar: VoidFunction;
}

/** Cadastro de um voluntário novo (abre num modal). Ele nasce "ativo": o status não é escolhido aqui. */
export function VoluntarioForm({ onFechar }: VoluntarioFormProps) {
  const criarVoluntario = useCreateVoluntario();
  const { toast } = useToast();
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<VoluntarioFormEntrada, unknown, VoluntarioFormSaida>({
    resolver: zodResolver(voluntarioSchema),
    defaultValues: VOLUNTARIO_FORM_VAZIO,
  });

  async function onSubmit(valores: VoluntarioFormSaida) {
    setErroServidor(null);
    try {
      // `paraDadosDoVoluntario` manda o telefone só com números (a API guarda assim).
      const voluntario = await criarVoluntario.mutateAsync(paraDadosDoVoluntario(valores));
      toast({
        tipo: "sucesso",
        titulo: "Voluntário cadastrado com sucesso!",
        descricao: `${voluntario.nome} já aparece na lista de voluntários.`,
      });
      onFechar();
    } catch (erro) {
      const { campo, mensagem } = erroDoCadastro(erro);
      if (campo) {
        setError(campo, { type: "server", message: mensagem });
        setFocus(campo);
      } else {
        setErroServidor(mensagem);
      }
    }
  }

  const salvando = criarVoluntario.isPending;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="voluntario-nome" required>
          Nome
        </Label>
        <Input
          id="voluntario-nome"
          autoComplete="off"
          placeholder="Ex: Maria da Silva"
          hasError={!!errors.nome}
          {...ariaDoCampo("voluntario-nome", !!errors.nome)}
          {...register("nome")}
        />
        <MensagemErro id="voluntario-nome-erro" mensagem={errors.nome?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="voluntario-telefone" required>
          Telefone ou WhatsApp
        </Label>
        <Controller
          control={control}
          name="telefone"
          render={({ field }) => (
            <Input
              id="voluntario-telefone"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              maxLength={15}
              placeholder="(00) 00000-0000"
              hasError={!!errors.telefone}
              {...ariaDoCampo("voluntario-telefone", !!errors.telefone)}
              value={field.value ?? ""}
              onBlur={field.onBlur}
              ref={field.ref}
              onChange={(evento) => field.onChange(formatPhone(evento.target.value))}
            />
          )}
        />
        <MensagemErro id="voluntario-telefone-erro" mensagem={errors.telefone?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="voluntario-email">
          E-mail <Opcional />
        </Label>
        <Input
          id="voluntario-email"
          type="email"
          autoComplete="off"
          placeholder="nome@exemplo.com"
          hasError={!!errors.email}
          {...ariaDoCampo("voluntario-email", !!errors.email)}
          {...register("email")}
        />
        <MensagemErro id="voluntario-email-erro" mensagem={errors.email?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="voluntario-tipo" required>
          Tipo
        </Label>
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger
                id="voluntario-tipo"
                ref={field.ref}
                onBlur={field.onBlur}
                hasError={!!errors.tipo}
                {...ariaDoCampo("voluntario-tipo", !!errors.tipo)}
              >
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_VOLUNTARIO.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {TIPO_VOLUNTARIO_INFO[tipo].rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <MensagemErro id="voluntario-tipo-erro" mensagem={errors.tipo?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="voluntario-bairro">
          Bairro <Opcional />
        </Label>
        <Input id="voluntario-bairro" autoComplete="off" placeholder="Ex: Centro" {...register("bairro")} />
      </div>

      <Controller
        control={control}
        name="areasDeAjuda"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2 md:col-span-2">
            <legend className="mb-1 text-base font-medium text-foreground">
              Como quer ajudar <Opcional />
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {AREAS_DE_AJUDA.map((area) => {
                const marcada = field.value.includes(area);
                return (
                  <label
                    key={area}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-sm transition-colors focus-within:ring-2 focus-within:ring-primary",
                      marcada ? "border-secondary bg-secondary/10 font-medium" : "border-border-subtle bg-card-muted",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 accent-secondary"
                      checked={marcada}
                      onChange={(evento) =>
                        field.onChange(
                          evento.target.checked
                            ? [...field.value, area]
                            : field.value.filter((valor) => valor !== area),
                        )
                      }
                    />
                    {AREA_DE_AJUDA_INFO[area].rotulo}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
      />

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
          {salvando ? "Salvando..." : "Cadastrar voluntário"}
        </Button>
      </div>
    </form>
  );
}
