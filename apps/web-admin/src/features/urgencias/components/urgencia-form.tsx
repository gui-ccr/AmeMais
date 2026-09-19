"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateUrgencia, useUpdateUrgencia } from "../hooks/use-urgencias";
import type { Urgencia, UrgenciaFormValues } from "../types";

const urgenciaSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  descricao: z.string(),
  ativo: z.boolean(),
});

const valoresPadrao: UrgenciaFormValues = {
  titulo: "",
  descricao: "",
  ativo: true,
};

interface UrgenciaFormProps {
  urgenciaParaEditar?: Urgencia | null;
  onFechar: VoidFunction;
}

export function UrgenciaForm({ urgenciaParaEditar, onFechar }: UrgenciaFormProps) {
  const criarUrgencia = useCreateUrgencia();
  const atualizarUrgencia = useUpdateUrgencia();
  const emEdicao = !!urgenciaParaEditar;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UrgenciaFormValues>({
    resolver: zodResolver(urgenciaSchema),
    defaultValues: urgenciaParaEditar ?? valoresPadrao,
  });

  async function onSubmit(values: UrgenciaFormValues) {
    if (urgenciaParaEditar) {
      await atualizarUrgencia.mutateAsync({ id: urgenciaParaEditar.id, input: values });
    } else {
      await criarUrgencia.mutateAsync(values);
    }
    onFechar();
  }

  const salvando = criarUrgencia.isPending || atualizarUrgencia.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="urgencia-titulo" required>
          O que a ONG precisa
        </Label>
        <Input
          id="urgencia-titulo"
          placeholder="Ex: Ração medicada (20kg)"
          hasError={!!errors.titulo}
          {...register("titulo")}
        />
        {errors.titulo && <p className="text-sm text-destructive font-medium">{errors.titulo.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="urgencia-status">Status</Label>
        <Controller
          control={control}
          name="ativo"
          render={({ field }) => (
            <Select
              value={field.value ? "true" : "false"}
              onValueChange={(value) => field.onChange(value === "true")}
            >
              <SelectTrigger id="urgencia-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Ativa</SelectItem>
                <SelectItem value="false">Atendida</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="urgencia-descricao">Detalhes (opcional)</Label>
        <Textarea
          id="urgencia-descricao"
          placeholder="Ex: para animais em tratamento no lar temporário"
          {...register("descricao")}
        />
      </div>

      <div className="md:col-span-2 flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onFechar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : emEdicao ? "Salvar alterações" : "Adicionar urgência"}
        </Button>
      </div>
    </form>
  );
}
