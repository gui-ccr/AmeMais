"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateEvent, useUpdateEvent } from "../hooks/use-events";
import { dataPermitePublicar, extrairDia, getStatusEvento } from "../status";
import type { CreateEventDTO, EventDTO, UpdateEventDTO } from "../types";
import { EventoStatusBadge } from "./evento-status-badge";

/**
 * O back só valida a publicação quando o evento passa a ficar publicado ou muda
 * de dia (Event.update). Por isso, editar um evento que JÁ está publicado sem
 * mexer na data (ex.: corrigir o título depois que o dia chegou) não é
 * bloqueado aqui — só quem publica ou troca a data precisa de uma data válida.
 */
function criarEventoSchema(eventoOriginal?: EventDTO | null) {
  const diaOriginal = eventoOriginal?.isActive ? extrairDia(eventoOriginal.dataEvento) : null;

  return z
    .object({
      titulo: z.string().trim().min(2, "Título deve ter pelo menos 2 caracteres"),
      descricao: z.string().optional(),
      dataEvento: z.string().optional(),
      isActive: z.boolean(),
    })
    .superRefine((valores, ctx) => {
      if (!valores.isActive) return;

      const dia = extrairDia(valores.dataEvento);
      if (!dia) {
        ctx.addIssue({ code: "custom", path: ["dataEvento"], message: "Informe a data para publicar o evento." });
      } else if (dia !== diaOriginal && !dataPermitePublicar(dia)) {
        ctx.addIssue({
          code: "custom",
          path: ["dataEvento"],
          message: "Para publicar, escolha uma data a partir de hoje — ou salve como rascunho.",
        });
      }
    });
}

const valoresPadrao: CreateEventDTO = {
  titulo: "",
  descricao: "",
  dataEvento: "",
  isActive: false,
};

/** Ao criar, a API rejeita string vazia em `descricao`/`dataEvento` (400): campo em branco é omitido. */
function montarPayloadCriacao(values: CreateEventDTO): CreateEventDTO {
  return {
    titulo: values.titulo.trim(),
    descricao: values.descricao?.trim() || undefined,
    dataEvento: extrairDia(values.dataEvento) ?? undefined,
    isActive: values.isActive,
  };
}

/** Ao editar, campo em branco vira `null` — é assim que o PATCH pede para limpar o valor. */
function montarPayloadEdicao(values: CreateEventDTO): UpdateEventDTO {
  return {
    titulo: values.titulo.trim(),
    descricao: values.descricao?.trim() || null,
    dataEvento: extrairDia(values.dataEvento),
    isActive: values.isActive,
  };
}

function mensagemDeErro(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";

    const mensagemDaApi = error.response.data?.error;
    if (typeof mensagemDaApi === "string") return mensagemDaApi;
  }
  return "Não foi possível salvar o evento. Tente novamente.";
}

interface EventoFormProps {
  eventoParaEditar?: EventDTO | null;
  onFechar: VoidFunction;
}

export function EventoForm({ eventoParaEditar, onFechar }: EventoFormProps) {
  const criarEvento = useCreateEvent();
  const atualizarEvento = useUpdateEvent();
  const emEdicao = !!eventoParaEditar;
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const eventoSchema = useMemo(() => criarEventoSchema(eventoParaEditar), [eventoParaEditar]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEventDTO>({
    resolver: zodResolver(eventoSchema),
    defaultValues: eventoParaEditar
      ? {
          titulo: eventoParaEditar.titulo,
          descricao: eventoParaEditar.descricao ?? "",
          // A API devolve ISO completo; o <input type="date"> só aceita AAAA-MM-DD.
          dataEvento: extrairDia(eventoParaEditar.dataEvento) ?? "",
          isActive: eventoParaEditar.isActive,
        }
      : valoresPadrao,
  });

  const [dataEvento, isActive] = useWatch({ control, name: ["dataEvento", "isActive"] });
  const situacao = getStatusEvento({ dataEvento, isActive });

  async function onSubmit(values: CreateEventDTO) {
    setErroServidor(null);

    try {
      if (eventoParaEditar) {
        await atualizarEvento.mutateAsync({ id: eventoParaEditar.id, input: montarPayloadEdicao(values) });
      } else {
        await criarEvento.mutateAsync(montarPayloadCriacao(values));
      }
      onFechar();
    } catch (error) {
      setErroServidor(mensagemDeErro(error));
    }
  }

  const salvando = criarEvento.isPending || atualizarEvento.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="evento-titulo" required>
          Título
        </Label>
        <Input
          id="evento-titulo"
          placeholder="Ex: Feira de Adoção - Praça Central"
          hasError={!!errors.titulo}
          {...register("titulo")}
        />
        {errors.titulo && <p className="text-sm text-destructive font-medium">{errors.titulo.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="evento-data">Data</Label>
        <Input id="evento-data" type="date" hasError={!!errors.dataEvento} {...register("dataEvento")} />
        {errors.dataEvento && <p className="text-sm text-destructive font-medium">{errors.dataEvento.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="evento-publicacao">Publicação</Label>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Select
              value={field.value ? "publicado" : "rascunho"}
              onValueChange={(value) => field.onChange(value === "publicado")}
            >
              <SelectTrigger id="evento-publicacao">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="publicado">Publicado</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div
        className="md:col-span-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border-2 border-border-subtle bg-card-muted px-3.5 py-2.5"
        aria-live="polite"
      >
        <span className="text-sm font-medium text-muted-dark">Situação:</span>
        <EventoStatusBadge evento={{ dataEvento, isActive }} />
        <span className="text-sm text-muted-foreground">{situacao.descricao}</span>
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="evento-descricao">Descrição</Label>
        <Textarea
          id="evento-descricao"
          placeholder="Detalhes do evento..."
          hasError={!!errors.descricao}
          {...register("descricao")}
        />
        {errors.descricao && <p className="text-sm text-destructive font-medium">{errors.descricao.message}</p>}
      </div>

      {erroServidor && (
        <p role="alert" className="md:col-span-2 text-sm text-destructive font-medium">
          {erroServidor}
        </p>
      )}

      <div className="md:col-span-2 flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onFechar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : emEdicao ? "Salvar alterações" : "Cadastrar evento"}
        </Button>
      </div>
    </form>
  );
}
