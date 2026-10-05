"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { ADOCAO_VAZIA, adocaoSchema, camposDaAdocaoSoltos, exigirAdocaoSeAdotado, paraAdocao } from "../adocao";
import { useUpdateAnimalStatus } from "../hooks/use-animais";
import { STATUS_DESCRICAO, STATUS_INFO, TRANSICOES_STATUS } from "../opcoes";
import { STATUS_ANIMAL, type Animal } from "../types";
import { CamposAdocao } from "./campos-adocao";
import { MensagemErro } from "@/components/ui/mensagem-erro";

const MENSAGEM_STATUS = "Selecione o novo status";

export const statusSchema = z
  .object({
    status: z.enum(STATUS_ANIMAL, { required_error: MENSAGEM_STATUS, invalid_type_error: MENSAGEM_STATUS }),
    ...camposDaAdocaoSoltos,
  })
  // Passar para "adotado" exige os dados da adoção.
  .superRefine(exigirAdocaoSeAdotado);

type FormEntrada = z.input<typeof statusSchema>;
type FormSaida = z.output<typeof statusSchema>;

interface AlterarStatusFormProps {
  animal: Animal;
  onFechar: VoidFunction;
}

export function AlterarStatusForm({ animal, onFechar }: AlterarStatusFormProps) {
  const atualizarStatus = useUpdateAnimalStatus();
  const { toast } = useToast();
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const metodos = useForm<FormEntrada, unknown, FormSaida>({
    resolver: zodResolver(statusSchema),
    defaultValues: ADOCAO_VAZIA,
  });
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = metodos;

  const novoStatus = useWatch({ control, name: "status" });
  const vaiAdotar = novoStatus === "adotado";
  const perdeDadosDaAdocao = animal.status === "adotado" && !!novoStatus && !vaiAdotar;

  // Foco no seletor ao abrir o modal.
  useEffect(() => {
    document.getElementById("alterar-status-novo")?.focus();
  }, []);

  async function onSubmit(values: FormSaida) {
    setErroServidor(null);

    try {
      await atualizarStatus.mutateAsync({
        id: animal.id,
        input: {
          status: values.status,
          // Os campos da adoção só foram validados (e só valem) quando o novo status é "adotado".
          adocao: values.status === "adotado" ? paraAdocao(adocaoSchema.parse(values)) : undefined,
        },
      });

      toast({
        tipo: "sucesso",
        titulo: "Status atualizado!",
        descricao: `${animal.nome} agora está como "${STATUS_INFO[values.status].rotulo}".`,
      });
      onFechar();
    } catch (erro) {
      setErroServidor(mensagemDeErroDaApi(erro, "Não foi possível atualizar o status. Tente novamente."));
    }
  }

  const salvando = atualizarStatus.isPending;

  return (
    <FormProvider {...metodos}>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-wrap items-center gap-2 md:col-span-2">
          <span className="text-sm font-medium text-muted-dark">Status atual:</span>
          <Badge variant={STATUS_INFO[animal.status].variante} size="sm" dot>
            {STATUS_INFO[animal.status].rotulo}
          </Badge>
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <Label htmlFor="alterar-status-novo" required>
            Novo status
          </Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger id="alterar-status-novo" hasError={!!errors.status}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {TRANSICOES_STATUS[animal.status].map((valor) => (
                    <SelectItem key={valor} value={valor}>
                      {STATUS_INFO[valor].rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <MensagemErro id="alterar-status-erro" mensagem={errors.status?.message} />
          {novoStatus && !errors.status && <p className="text-xs text-muted-foreground">{STATUS_DESCRICAO[novoStatus]}</p>}
        </div>

        {perdeDadosDaAdocao && (
          <p
            role="status"
            className="md:col-span-2 flex items-start gap-2 rounded-xl border-2 border-border-subtle bg-card-muted px-3.5 py-2.5 text-sm text-muted-dark"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Ao tirar o animal de &quot;Adotado&quot;, os dados do adotante e da adoção são apagados.
          </p>
        )}

        {vaiAdotar && <CamposAdocao />}

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
            {salvando ? "Salvando..." : "Salvar status"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
