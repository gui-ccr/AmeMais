"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateEvent, useUpdateEvent } from "../hooks/use-events";
import type { CreateEventDTO, EventDTO } from "../types";

const eventoSchema = z.object({
  titulo: z.string().min(2, "Título deve ter pelo menos 2 caracteres"),
  descricao: z.string().optional(),
  dataEvento: z.string().optional(),
  isActive: z.boolean(),
});

const valoresPadrao: CreateEventDTO = {
  titulo: "",
  descricao: "",
  dataEvento: "",
  isActive: false,
};

interface EventoFormProps {
  eventoParaEditar?: EventDTO | null;
  onCancelarEdicao?: VoidFunction;
}

export function EventoForm({ eventoParaEditar, onCancelarEdicao }: EventoFormProps) {
  const criarEvento = useCreateEvent();
  const atualizarEvento = useUpdateEvent();
  const emEdicao = !!eventoParaEditar;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateEventDTO>({
    resolver: zodResolver(eventoSchema),
    defaultValues: valoresPadrao,
  });

  useEffect(() => {
    reset(
      eventoParaEditar
        ? {
            titulo: eventoParaEditar.titulo,
            descricao: eventoParaEditar.descricao ?? "",
            dataEvento: eventoParaEditar.dataEvento ?? "",
            isActive: eventoParaEditar.isActive,
          }
        : valoresPadrao,
    );
  }, [eventoParaEditar, reset]);

  async function onSubmit(values: CreateEventDTO) {
    if (eventoParaEditar) {
      await atualizarEvento.mutateAsync({ id: eventoParaEditar.id, input: values });
      onCancelarEdicao?.();
    } else {
      await criarEvento.mutateAsync(values);
      reset(valoresPadrao);
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
        <Input id="evento-data" type="date" {...register("dataEvento")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="evento-status">Status</Label>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Select
              value={field.value ? "true" : "false"}
              onValueChange={(value) => field.onChange(value === "true")}
            >
              <SelectTrigger id="evento-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Ativo</SelectItem>
                <SelectItem value="false">Inativo</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="evento-descricao">Descrição</Label>
        <Textarea id="evento-descricao" placeholder="Detalhes do evento..." {...register("descricao")} />
      </div>

      <div className="md:col-span-2 flex justify-end gap-3 pt-2">
        {emEdicao && (
          <Button type="button" variant="outline" onClick={() => onCancelarEdicao?.()}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : emEdicao ? "Salvar alterações" : "Cadastrar evento"}
        </Button>
      </div>
    </form>
  );
}
