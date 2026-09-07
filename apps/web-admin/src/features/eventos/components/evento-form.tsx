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
import { TIPOS_EVENTO, type Evento, type EventoFormValues } from "../types";

const eventoSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  tipo: z.enum(TIPOS_EVENTO),
  descricao: z.string(),
  dataEvento: z.string().min(1, "Data é obrigatória"),
  local: z.string(),
});

const valoresPadrao: EventoFormValues = {
  titulo: "",
  tipo: "Feira de Adoção",
  descricao: "",
  dataEvento: "",
  local: "",
};

interface EventoFormProps {
  eventoParaEditar?: Evento | null;
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
  } = useForm<EventoFormValues>({
    resolver: zodResolver(eventoSchema),
    defaultValues: valoresPadrao,
  });

  useEffect(() => {
    reset(eventoParaEditar ?? valoresPadrao);
  }, [eventoParaEditar, reset]);

  async function onSubmit(values: EventoFormValues) {
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
        <Label htmlFor="evento-tipo" required>
          Tipo
        </Label>
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="evento-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_EVENTO.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="evento-data" required>
          Data
        </Label>
        <Input
          id="evento-data"
          type="date"
          hasError={!!errors.dataEvento}
          {...register("dataEvento")}
        />
        {errors.dataEvento && (
          <p className="text-sm text-destructive font-medium">{errors.dataEvento.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="evento-local">Local</Label>
        <Input id="evento-local" placeholder="Ex: Praça Central, Teófilo Otoni" {...register("local")} />
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
