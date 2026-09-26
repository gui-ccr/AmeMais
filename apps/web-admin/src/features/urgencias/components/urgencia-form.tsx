"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { useCreateUrgencia, useUpdateUrgencia } from "../hooks/use-urgencias";
import { PRIORIDADE_INFO, TIPO_INFO, UNIDADE_INFO } from "../opcoes";
import { extrairDia, getSituacaoUrgencia } from "../situacao";
import {
  PRIORIDADES_URGENCIA,
  TIPOS_DOACAO,
  UNIDADES_META,
  type TipoDoacao,
  type Urgencia,
  type UrgenciaFormValues,
} from "../types";

/** Campo numérico opcional: vazio vira null; texto que não é número cai na mensagem de erro. */
const vazioParaNull = (valor: unknown) => (valor === "" || valor === null || valor === undefined ? null : Number(valor));

const urgenciaSchema = z
  .object({
    titulo: z.string().trim().min(2, "Título deve ter pelo menos 2 caracteres"),
    descricao: z.string(),
    tipo: z.enum(TIPOS_DOACAO),
    prioridade: z.enum(PRIORIDADES_URGENCIA),
    dataLimite: z.string(),
    meta: z.preprocess(
      vazioParaNull,
      z.number({ invalid_type_error: "Informe um número" }).positive("Deve ser maior que zero").nullable(),
    ),
    unidade: z.enum(UNIDADES_META),
    arrecadado: z.preprocess(
      (valor) => vazioParaNull(valor) ?? 0,
      z.number({ invalid_type_error: "Informe um número" }).nonnegative("Não pode ser negativo"),
    ),
    ativo: z.boolean(),
  })
  .superRefine(({ meta, arrecadado }, ctx) => {
    if (meta !== null && arrecadado > meta) {
      ctx.addIssue({
        code: "custom",
        path: ["arrecadado"],
        message: "Não pode ser maior que a quantidade necessária.",
      });
    }
  });

type FormEntrada = z.input<typeof urgenciaSchema>;
type FormSaida = z.output<typeof urgenciaSchema>;

const valoresPadrao: FormEntrada = {
  titulo: "",
  descricao: "",
  tipo: "racao",
  prioridade: "importante",
  dataLimite: "",
  meta: "",
  unidade: "kg",
  arrecadado: 0,
  ativo: true,
};

function paraNumero(valor: unknown): number | null {
  const numero = vazioParaNull(valor);
  return numero !== null && Number.isFinite(numero) ? numero : null;
}

interface UrgenciaFormProps {
  urgenciaParaEditar?: Urgencia | null;
  onFechar: VoidFunction;
}

export function UrgenciaForm({ urgenciaParaEditar, onFechar }: UrgenciaFormProps) {
  const criarUrgencia = useCreateUrgencia();
  const atualizarUrgencia = useUpdateUrgencia();
  const emEdicao = !!urgenciaParaEditar;
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<FormEntrada, unknown, FormSaida>({
    resolver: zodResolver(urgenciaSchema),
    defaultValues: urgenciaParaEditar
      ? {
          titulo: urgenciaParaEditar.titulo,
          descricao: urgenciaParaEditar.descricao,
          tipo: urgenciaParaEditar.tipo,
          prioridade: urgenciaParaEditar.prioridade,
          dataLimite: extrairDia(urgenciaParaEditar.dataLimite) ?? "",
          meta: urgenciaParaEditar.meta ?? "",
          unidade: urgenciaParaEditar.unidade,
          arrecadado: urgenciaParaEditar.arrecadado,
          ativo: urgenciaParaEditar.ativo,
        }
      : valoresPadrao,
  });

  const [prioridade, meta, unidade, arrecadado, dataLimite] = useWatch({
    control,
    name: ["prioridade", "meta", "unidade", "arrecadado", "dataLimite"],
  });
  const situacao = getSituacaoUrgencia({
    meta: paraNumero(meta),
    arrecadado: paraNumero(arrecadado) ?? 0,
    unidade,
    dataLimite: extrairDia(dataLimite),
  });

  async function onSubmit(values: FormSaida) {
    setErroServidor(null);

    const payload: UrgenciaFormValues = {
      titulo: values.titulo,
      descricao: values.descricao.trim(),
      tipo: values.tipo,
      prioridade: values.prioridade,
      dataLimite: extrairDia(values.dataLimite),
      meta: values.meta,
      unidade: values.unidade,
      arrecadado: values.arrecadado,
      ativo: values.ativo,
    };

    try {
      if (urgenciaParaEditar) {
        await atualizarUrgencia.mutateAsync({ id: urgenciaParaEditar.id, input: payload });
      } else {
        await criarUrgencia.mutateAsync(payload);
      }
      onFechar();
    } catch (error) {
      setErroServidor(mensagemDeErroDaApi(error, "Não foi possível salvar a urgência. Tente novamente."));
    }
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
        <Label htmlFor="urgencia-tipo">Tipo de doação</Label>
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(valor) => {
                field.onChange(valor);
                // Só sugere a unidade ao cadastrar e enquanto a pessoa não escolheu uma à mão.
                if (!emEdicao && !dirtyFields.unidade) {
                  setValue("unidade", TIPO_INFO[valor as TipoDoacao].unidadeSugerida);
                }
              }}
            >
              <SelectTrigger id="urgencia-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_DOACAO.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {TIPO_INFO[tipo].rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="urgencia-prioridade">Prioridade</Label>
        <Controller
          control={control}
          name="prioridade"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="urgencia-prioridade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORIDADES_URGENCIA.map((valor) => (
                  <SelectItem key={valor} value={valor}>
                    {PRIORIDADE_INFO[valor].rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p className="text-xs text-muted-foreground">{PRIORIDADE_INFO[prioridade].descricao}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:col-span-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="urgencia-meta">Quantidade necessária</Label>
          <Input
            id="urgencia-meta"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="Ex: 20"
            hasError={!!errors.meta}
            {...register("meta")}
          />
          {errors.meta && <p className="text-sm text-destructive font-medium">{errors.meta.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="urgencia-unidade">Unidade</Label>
          <Controller
            control={control}
            name="unidade"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="urgencia-unidade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES_META.map((valor) => (
                    <SelectItem key={valor} value={valor}>
                      {UNIDADE_INFO[valor].rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="urgencia-arrecadado">Já arrecadado</Label>
          <Input
            id="urgencia-arrecadado"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            hasError={!!errors.arrecadado}
            {...register("arrecadado")}
          />
          {errors.arrecadado && <p className="text-sm text-destructive font-medium">{errors.arrecadado.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="urgencia-data-limite">Data limite</Label>
        <Input id="urgencia-data-limite" type="date" {...register("dataLimite")} />
        <p className="text-xs text-muted-foreground">Opcional — deixe em branco se não há prazo.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="urgencia-exibicao">Exibição no site</Label>
        <Controller
          control={control}
          name="ativo"
          render={({ field }) => (
            <Select value={field.value ? "true" : "false"} onValueChange={(valor) => field.onChange(valor === "true")}>
              <SelectTrigger id="urgencia-exibicao">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Visível</SelectItem>
                <SelectItem value="false">Oculta</SelectItem>
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
        <Badge variant={situacao.variante} size="sm" dot>
          {situacao.rotulo}
        </Badge>
        <span className="text-sm text-muted-foreground">{situacao.descricao}</span>
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="urgencia-descricao">Detalhes (opcional)</Label>
        <Textarea
          id="urgencia-descricao"
          placeholder="Ex: para animais em tratamento no lar temporário"
          {...register("descricao")}
        />
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
          {salvando ? "Salvando..." : emEdicao ? "Salvar alterações" : "Adicionar urgência"}
        </Button>
      </div>
    </form>
  );
}
