"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MensagemErro } from "@/components/ui/mensagem-erro";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { camposPublicosSchema } from "../campos-publicos";
import { useUpdateAnimal } from "../hooks/use-animais";
import { ESPECIE_INFO } from "../opcoes";
import { ESPECIES, type Animal } from "../types";
import { CamposPublicos } from "./campos-publicos";

const MENSAGEM_ESPECIE = "Selecione a espécie";

/** Edição dos dados do animal. Status, foto e adoção têm fluxos próprios e não entram aqui. */
export const editarAnimalSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do animal (mínimo 2 letras)"),
  especie: z.enum(ESPECIES, { required_error: MENSAGEM_ESPECIE, invalid_type_error: MENSAGEM_ESPECIE }),
  raca: z.string().trim().min(2, "Informe a raça (ou SRD, se não tiver raça definida)"),
  ...camposPublicosSchema,
});

type FormEntrada = z.input<typeof editarAnimalSchema>;
type FormSaida = z.output<typeof editarAnimalSchema>;

interface EditarAnimalFormProps {
  animal: Animal;
  onFechar: VoidFunction;
}

export function EditarAnimalForm({ animal, onFechar }: EditarAnimalFormProps) {
  const atualizarAnimal = useUpdateAnimal();
  const { toast } = useToast();
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const metodos = useForm<FormEntrada, unknown, FormSaida>({
    resolver: zodResolver(editarAnimalSchema),
    defaultValues: {
      nome: animal.nome,
      especie: animal.especie,
      raca: animal.raca,
      porte: animal.porte,
      faixaEtaria: animal.faixaEtaria,
      idadeTexto: animal.idadeTexto,
      descricao: animal.descricao,
    },
  });
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = metodos;

  // Foco no nome ao abrir o modal.
  useEffect(() => {
    document.getElementById("editar-animal-nome")?.focus();
  }, []);

  async function onSubmit(values: FormSaida) {
    setErroServidor(null);

    try {
      await atualizarAnimal.mutateAsync({ id: animal.id, input: values });

      toast({
        tipo: "sucesso",
        titulo: "Animal atualizado!",
        descricao: `Os dados de ${values.nome} foram salvos.`,
      });
      onFechar();
    } catch (erro) {
      setErroServidor(mensagemDeErroDaApi(erro, "Não foi possível salvar o animal. Tente novamente."));
    }
  }

  const salvando = atualizarAnimal.isPending;

  return (
    <FormProvider {...metodos}>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="editar-animal-nome" required>
            Nome
          </Label>
          <Input id="editar-animal-nome" hasError={!!errors.nome} {...register("nome")} />
          <MensagemErro id="editar-animal-nome-erro" mensagem={errors.nome?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="editar-animal-especie" required>
            Espécie
          </Label>
          <Controller
            control={control}
            name="especie"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger id="editar-animal-especie" hasError={!!errors.especie}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {ESPECIES.map((especie) => (
                    <SelectItem key={especie} value={especie}>
                      {ESPECIE_INFO[especie].rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <MensagemErro id="editar-animal-especie-erro" mensagem={errors.especie?.message} />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <Label htmlFor="editar-animal-raca" required>
            Raça
          </Label>
          <Input id="editar-animal-raca" hasError={!!errors.raca} {...register("raca")} />
          <MensagemErro id="editar-animal-raca-erro" mensagem={errors.raca?.message} />
        </div>

        <CamposPublicos prefixo="editar-animal" />

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
            {salvando ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
