"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MensagemErro } from "@/components/ui/mensagem-erro";
import { Opcional } from "@/components/ui/opcional";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CamposPublicosForm } from "../campos-publicos";
import { FAIXA_ETARIA_INFO, PORTE_INFO } from "../opcoes";
import { DESCRICAO_MAX, FAIXAS_ETARIAS, IDADE_TEXTO_MAX, PORTES } from "../types";

/**
 * Porte, faixa etária, idade em texto e descrição — o que aparece no site público.
 * Precisa estar dentro de um `<FormProvider>` com os campos de `CamposPublicosForm` e de um
 * grid de 2 colunas (devolve só as células). `prefixo` evita ids repetidos entre formulários.
 */
export function CamposPublicos({ prefixo }: { prefixo: string }) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CamposPublicosForm>();
  const descricao = useWatch({ control, name: "descricao" }) ?? "";

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefixo}-porte`} required>
          Porte
        </Label>
        <Controller
          control={control}
          name="porte"
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger id={`${prefixo}-porte`} hasError={!!errors.porte}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {PORTES.map((porte) => (
                  <SelectItem key={porte} value={porte}>
                    {PORTE_INFO[porte].rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <MensagemErro id={`${prefixo}-porte-erro`} mensagem={errors.porte?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefixo}-faixa-etaria`} required>
          Faixa etária
        </Label>
        <Controller
          control={control}
          name="faixaEtaria"
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger id={`${prefixo}-faixa-etaria`} hasError={!!errors.faixaEtaria}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {FAIXAS_ETARIAS.map((faixa) => (
                  <SelectItem key={faixa} value={faixa}>
                    {FAIXA_ETARIA_INFO[faixa].rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <MensagemErro id={`${prefixo}-faixa-etaria-erro`} mensagem={errors.faixaEtaria?.message} />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor={`${prefixo}-idade-texto`}>
          Idade <Opcional />
        </Label>
        <Input
          id={`${prefixo}-idade-texto`}
          placeholder="Ex: 2 anos e 3 meses"
          maxLength={IDADE_TEXTO_MAX}
          hasError={!!errors.idadeTexto}
          {...register("idadeTexto")}
        />
        <MensagemErro id={`${prefixo}-idade-texto-erro`} mensagem={errors.idadeTexto?.message} />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor={`${prefixo}-descricao`}>
          Descrição <Opcional />
        </Label>
        <Textarea
          id={`${prefixo}-descricao`}
          placeholder="Conte um pouco sobre o jeito do animal. Esse texto aparece no site."
          maxLength={DESCRICAO_MAX}
          aria-describedby={`${prefixo}-descricao-contador`}
          hasError={!!errors.descricao}
          {...register("descricao")}
        />
        <div className="flex items-start justify-between gap-3">
          <MensagemErro id={`${prefixo}-descricao-erro`} mensagem={errors.descricao?.message} />
          <span id={`${prefixo}-descricao-contador`} className="ml-auto text-xs text-muted-foreground">
            {descricao.length}/{DESCRICAO_MAX}
          </span>
        </div>
      </div>
    </>
  );
}
