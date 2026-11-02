"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm, useWatch, type FieldErrors, type FieldPath } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { FotoDropzone } from "@/components/ui/foto-dropzone";
import { IndicadorDePassos } from "@/components/ui/indicador-de-passos";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { mensagemDeFotoInvalida } from "@/lib/foto";
import {
  ADOCAO_VAZIA,
  adocaoSchema,
  camposDaAdocaoSoltos,
  exigirAdocaoSeAdotado,
  paraAdocao,
} from "../adocao";
import { CAMPOS_PUBLICOS_VAZIOS, NOMES_CAMPOS_PUBLICOS, camposPublicosSchema } from "../campos-publicos";
import { useCreateAnimal } from "../hooks/use-animais";
import { ESPECIE_INFO, STATUS_DESCRICAO, STATUS_INFO } from "../opcoes";
import { ESPECIES, STATUS_NO_CADASTRO } from "../types";
import { CamposAdocao } from "./campos-adocao";
import { CamposPublicos } from "./campos-publicos";
import { MensagemErro } from "@/components/ui/mensagem-erro";

const MENSAGEM_ESPECIE = "Selecione a espécie";
const MENSAGEM_STATUS = "Selecione o status do animal";

export const animalSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe o nome do animal (mínimo 2 letras)"),
    especie: z.enum(ESPECIES, { required_error: MENSAGEM_ESPECIE, invalid_type_error: MENSAGEM_ESPECIE }),
    raca: z.string().trim().min(2, "Informe a raça (ou SRD, se não tiver raça definida)"),
    foto: z.custom<File | null>().superRefine((arquivo, ctx) => {
      if (!(arquivo instanceof File)) {
        ctx.addIssue({ code: "custom", message: "Envie uma foto do animal" });
        return;
      }

      const problema = mensagemDeFotoInvalida(arquivo);
      if (problema) ctx.addIssue({ code: "custom", message: problema });
    }),
    status: z.enum(STATUS_NO_CADASTRO, { required_error: MENSAGEM_STATUS, invalid_type_error: MENSAGEM_STATUS }),
    ...camposPublicosSchema,
    ...camposDaAdocaoSoltos,
  })
  // Só um animal que já nasce adotado precisa dos dados da adoção.
  .superRefine(exigirAdocaoSeAdotado);

type FormEntrada = z.input<typeof animalSchema>;
type FormSaida = z.output<typeof animalSchema>;

const CAMPOS_ANIMAL: FieldPath<FormEntrada>[] = ["nome", "especie", "raca", "foto", "status", ...NOMES_CAMPOS_PUBLICOS];

const PASSOS = ["Animal", "Adoção"] as const;

interface AnimalFormProps {
  onFechar: VoidFunction;
}

export function AnimalForm({ onFechar }: AnimalFormProps) {
  const criarAnimal = useCreateAnimal();
  const { toast } = useToast();
  const [passo, setPasso] = useState(0);
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  // Depois de uma tentativa de avançar/enviar com erro, cada alteração revalida o campo
  // na hora (o RHF só faz isso sozinho depois de um submit, e aqui a etapa 1 usa `trigger`).
  const [revalidarAoDigitar, setRevalidarAoDigitar] = useState(false);

  const metodos = useForm<FormEntrada, unknown, FormSaida>({
    resolver: zodResolver(animalSchema),
    defaultValues: {
      nome: "",
      raca: "",
      foto: null,
      ...CAMPOS_PUBLICOS_VAZIOS,
      ...ADOCAO_VAZIA,
    },
  });
  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = metodos;

  // A etapa da adoção só existe quando o animal já nasce adotado; nos outros status é um passo só.
  const status = useWatch({ control, name: "status" });
  const jaAdotado = status === "adotado";
  const ultimoPasso = jaAdotado ? passo === 1 : true;

  useEffect(() => {
    if (!revalidarAoDigitar) return;

    const inscricao = watch((_valores, { name }) => {
      if (name) void trigger(name);
    });
    return () => inscricao.unsubscribe();
  }, [revalidarAoDigitar, watch, trigger]);

  // Leva o foco para o nome ao abrir (o foco da etapa 2 vem do `focarAoMontar` dos campos da adoção).
  useEffect(() => {
    if (passo === 0) document.getElementById("animal-nome")?.focus();
  }, [passo]);

  async function avancar() {
    const valido = await trigger(CAMPOS_ANIMAL, { shouldFocus: true });
    if (valido) {
      // Etapa 2 começa "limpa": só mostra erro depois de uma tentativa de enviar.
      setRevalidarAoDigitar(false);
      setPasso(1);
    } else {
      setRevalidarAoDigitar(true);
    }
  }

  // Só volta para a etapa 1 se algum campo dela estiver inválido ao enviar.
  function aoInvalidar(erros: FieldErrors<FormEntrada>) {
    setRevalidarAoDigitar(true);
    if (CAMPOS_ANIMAL.some((campo) => campo in erros)) setPasso(0);
  }

  async function onSubmit(values: FormSaida) {
    if (!values.foto) return;
    setErroServidor(null);

    try {
      const animal = await criarAnimal.mutateAsync({
        nome: values.nome,
        especie: values.especie,
        raca: values.raca,
        porte: values.porte,
        faixaEtaria: values.faixaEtaria,
        idadeTexto: values.idadeTexto,
        descricao: values.descricao,
        foto: values.foto,
        status: values.status,
        // Os campos da adoção só foram validados (e só valem) se o animal já nasce adotado.
        adocao: values.status === "adotado" ? paraAdocao(adocaoSchema.parse(values)) : undefined,
      });

      toast({
        tipo: "sucesso",
        titulo: "Animal cadastrado com sucesso!",
        descricao: `${animal.nome} já aparece na lista de animais.`,
      });
      onFechar();
    } catch (erro) {
      setErroServidor(mensagemDeErroDaApi(erro, "Não foi possível cadastrar o animal. Tente novamente."));
    }
  }

  const salvando = criarAnimal.isPending;

  return (
    <div>
      {jaAdotado && <IndicadorDePassos passos={PASSOS} passoAtual={passo} />}

      <FormProvider {...metodos}>
        <form
          noValidate
          onSubmit={(evento) => {
            // Enter antes da última etapa avança em vez de enviar o cadastro.
            if (!ultimoPasso) {
              evento.preventDefault();
              void avancar();
              return;
            }
            void handleSubmit(onSubmit, aoInvalidar)(evento);
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {passo === 0 && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="animal-nome" required>
                  Nome
                </Label>
                <Input id="animal-nome" placeholder="Ex: Thor" hasError={!!errors.nome} {...register("nome")} />
                <MensagemErro id="animal-nome-erro" mensagem={errors.nome?.message} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="animal-especie" required>
                  Espécie
                </Label>
                <Controller
                  control={control}
                  name="especie"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger id="animal-especie" hasError={!!errors.especie}>
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
                <MensagemErro id="animal-especie-erro" mensagem={errors.especie?.message} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="animal-raca" required>
                  Raça
                </Label>
                <Input
                  id="animal-raca"
                  placeholder="Ex: SRD (sem raça definida)"
                  hasError={!!errors.raca}
                  {...register("raca")}
                />
                <MensagemErro id="animal-raca-erro" mensagem={errors.raca?.message} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="animal-status" required>
                  Status
                </Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger id="animal-status" hasError={!!errors.status}>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_NO_CADASTRO.map((valor) => (
                          <SelectItem key={valor} value={valor}>
                            {STATUS_INFO[valor].rotulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <MensagemErro id="animal-status-erro" mensagem={errors.status?.message} />
                {status && !errors.status && <p className="text-xs text-muted-foreground">{STATUS_DESCRICAO[status]}</p>}
              </div>

              <CamposPublicos prefixo="animal" />

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="animal-foto" required>
                  Foto
                </Label>
                <Controller
                  control={control}
                  name="foto"
                  render={({ field }) => (
                    <FotoDropzone
                      id="animal-foto"
                      value={field.value ?? null}
                      hasError={!!errors.foto}
                      onChange={(arquivo) => {
                        field.onChange(arquivo);
                        // Avisa na hora se o arquivo escolhido não serve (tipo/tamanho).
                        if (arquivo) void trigger("foto");
                      }}
                    />
                  )}
                />
                <MensagemErro id="animal-foto-erro" mensagem={errors.foto?.message} />
              </div>
            </>
          )}

          {passo === 1 && jaAdotado && <CamposAdocao focarAoMontar />}

          {erroServidor && (
            <p role="alert" className="md:col-span-2 text-sm text-destructive font-medium">
              {erroServidor}
            </p>
          )}

          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
            {passo === 1 ? (
              <Button key="voltar" type="button" variant="ghost" className="gap-1.5" onClick={() => setPasso(0)}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Voltar
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onFechar}>
                Cancelar
              </Button>
              {ultimoPasso ? (
                <Button key="cadastrar" type="submit" disabled={salvando}>
                  {salvando ? "Salvando..." : "Cadastrar animal"}
                </Button>
              ) : (
                <Button key="proximo" type="submit" className="gap-1.5">
                  Próximo
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
