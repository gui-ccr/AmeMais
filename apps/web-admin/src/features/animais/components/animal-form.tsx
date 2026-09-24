"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, type FieldPath, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { CepNaoEncontradoError, buscarCep } from "@/lib/viacep";
import { cepSchema } from "@/lib/validations";
import { formatCEP } from "@/utils";
import { useCreateAnimal } from "../hooks/use-animais";
import { ESPECIE_INFO, TAMANHO_MAXIMO_FOTO_BYTES, TAMANHO_MAXIMO_FOTO_MB, TIPOS_FOTO_ACEITOS } from "../opcoes";
import { ESPECIES } from "../types";
import { FotoDropzone } from "./foto-dropzone";

const MENSAGEM_ESPECIE = "Selecione a espécie";

const animalSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do animal (mínimo 2 letras)"),
  especie: z.enum(ESPECIES, { required_error: MENSAGEM_ESPECIE, invalid_type_error: MENSAGEM_ESPECIE }),
  raca: z.string().trim().min(2, "Informe a raça (ou SRD, se não tiver raça definida)"),
  foto: z.custom<File | null>().superRefine((arquivo, ctx) => {
    if (!(arquivo instanceof File)) {
      ctx.addIssue({ code: "custom", message: "Envie uma foto do animal" });
    } else if (!TIPOS_FOTO_ACEITOS.some((tipo) => tipo === arquivo.type)) {
      ctx.addIssue({ code: "custom", message: "A foto deve ser JPG, PNG ou WebP" });
    } else if (arquivo.size > TAMANHO_MAXIMO_FOTO_BYTES) {
      ctx.addIssue({ code: "custom", message: `A foto deve ter no máximo ${TAMANHO_MAXIMO_FOTO_MB} MB` });
    }
  }),
  adotanteNome: z.string().trim().min(2, "Informe o nome do adotante"),
  adotanteIdade: z.preprocess(
    (valor) => (valor === "" || valor === null || valor === undefined ? undefined : Number(valor)),
    z
      .number({ required_error: "Informe a idade do adotante", invalid_type_error: "Informe a idade do adotante" })
      .int("A idade deve ser um número inteiro")
      .min(1, "Informe uma idade válida")
      .max(120, "Informe uma idade válida"),
  ),
  cep: cepSchema,
  localidade: z.string().trim().min(2, "Informe a localidade"),
  dataAdocao: z
    .string()
    .min(1, "Informe a data da adoção")
    .refine((valor) => !Number.isNaN(Date.parse(valor)), "A data informada é inválida"),
});

type FormEntrada = z.input<typeof animalSchema>;
type FormSaida = z.output<typeof animalSchema>;

const CAMPOS_ANIMAL: FieldPath<FormEntrada>[] = ["nome", "especie", "raca", "foto"];

const PASSOS = ["Animal", "Adoção"] as const;

type BuscaCep =
  | { estado: "ocioso" }
  | { estado: "buscando" }
  | { estado: "encontrado"; endereco: string }
  | { estado: "nao-encontrado" }
  | { estado: "erro" };

function MensagemErro({ id, mensagem }: { id: string; mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <p id={id} className="text-sm text-destructive font-medium">
      {mensagem}
    </p>
  );
}

function IndicadorDePassos({ passoAtual }: { passoAtual: number }) {
  return (
    <ol className="mb-5 flex items-center gap-2" aria-label="Etapas do cadastro">
      {PASSOS.map((titulo, indice) => {
        const concluido = indice < passoAtual;
        const atual = indice === passoAtual;

        return (
          <li key={titulo} aria-current={atual ? "step" : undefined} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm font-semibold",
                concluido && "border-status-success-fg bg-status-success-fg text-white",
                atual && "border-primary bg-primary text-white",
                !concluido && !atual && "border-border-muted text-muted-foreground",
              )}
            >
              {concluido ? <Check className="h-4 w-4" aria-hidden="true" /> : indice + 1}
            </span>
            <span className={cn("text-sm font-medium", atual ? "text-foreground" : "text-muted-foreground")}>
              {titulo}
            </span>
            {indice < PASSOS.length - 1 && <span aria-hidden="true" className="mx-1 h-0.5 w-8 bg-border-subtle" />}
          </li>
        );
      })}
    </ol>
  );
}

interface AnimalFormProps {
  onFechar: VoidFunction;
}

export function AnimalForm({ onFechar }: AnimalFormProps) {
  const criarAnimal = useCreateAnimal();
  const { toast } = useToast();
  const [passo, setPasso] = useState(0);
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [buscaCep, setBuscaCep] = useState<BuscaCep>({ estado: "ocioso" });
  // Depois de uma tentativa de avançar/enviar com erro, cada alteração revalida o campo
  // na hora (o RHF só faz isso sozinho depois de um submit, e aqui a etapa 1 usa `trigger`).
  const [revalidarAoDigitar, setRevalidarAoDigitar] = useState(false);
  const controladorCep = useRef<AbortController | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<FormEntrada, unknown, FormSaida>({
    resolver: zodResolver(animalSchema),
    defaultValues: {
      nome: "",
      raca: "",
      foto: null,
      adotanteNome: "",
      adotanteIdade: "",
      cep: "",
      localidade: "",
      dataAdocao: "",
    },
  });

  // Cancela uma consulta de CEP em andamento se o modal for fechado.
  useEffect(() => () => controladorCep.current?.abort(), []);

  useEffect(() => {
    if (!revalidarAoDigitar) return;

    const inscricao = watch((_valores, { name }) => {
      if (name) void trigger(name);
    });
    return () => inscricao.unsubscribe();
  }, [revalidarAoDigitar, watch, trigger]);

  // Leva o foco para o primeiro campo da etapa que acabou de aparecer.
  useEffect(() => {
    document.getElementById(passo === 0 ? "animal-nome" : "animal-adotante-nome")?.focus();
  }, [passo]);

  async function consultarCep(cepFormatado: string) {
    controladorCep.current?.abort();

    if (cepFormatado.replace(/\D/g, "").length !== 8) {
      setBuscaCep({ estado: "ocioso" });
      return;
    }

    const controlador = new AbortController();
    controladorCep.current = controlador;
    setBuscaCep({ estado: "buscando" });

    try {
      const endereco = await buscarCep(cepFormatado, controlador.signal);
      const localidade = [endereco.localidade, endereco.uf].filter(Boolean).join(" - ");
      setValue("localidade", localidade, { shouldValidate: true, shouldDirty: true });
      setBuscaCep({
        estado: "encontrado",
        endereco: [endereco.logradouro, endereco.bairro].filter(Boolean).join(", ") || localidade,
      });
    } catch (erro) {
      if (controlador.signal.aborted) return;
      setBuscaCep(erro instanceof CepNaoEncontradoError ? { estado: "nao-encontrado" } : { estado: "erro" });
    }
  }

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
        foto: values.foto,
        adotante: {
          nome: values.adotanteNome,
          idade: values.adotanteIdade,
          cep: values.cep,
          localidade: values.localidade,
        },
        dataAdocao: values.dataAdocao,
      });

      toast({
        tipo: "sucesso",
        titulo: "Animal cadastrado com sucesso!",
        descricao: `${animal.nome} já aparece na lista de animais.`,
      });
      onFechar();
    } catch (erro) {
      setErroServidor(erro instanceof Error ? erro.message : "Não foi possível cadastrar o animal. Tente novamente.");
    }
  }

  const salvando = criarAnimal.isPending;

  return (
    <div>
      <IndicadorDePassos passoAtual={passo} />

      <form
        noValidate
        onSubmit={(evento) => {
          // Enter na etapa 1 avança em vez de enviar o cadastro.
          if (passo === 0) {
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

            <div className="flex flex-col gap-1.5 md:col-span-2">
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

        {passo === 1 && (
          <>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label htmlFor="animal-adotante-nome" required>
                Nome do adotante
              </Label>
              <Input
                id="animal-adotante-nome"
                placeholder="Ex: Maria Souza"
                hasError={!!errors.adotanteNome}
                {...register("adotanteNome")}
              />
              <MensagemErro id="animal-adotante-nome-erro" mensagem={errors.adotanteNome?.message} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="animal-adotante-idade" required>
                Idade do adotante
              </Label>
              <Input
                id="animal-adotante-idade"
                type="number"
                inputMode="numeric"
                min="1"
                max="120"
                step="1"
                placeholder="Ex: 34"
                hasError={!!errors.adotanteIdade}
                {...register("adotanteIdade")}
              />
              <MensagemErro id="animal-adotante-idade-erro" mensagem={errors.adotanteIdade?.message} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="animal-data-adocao" required>
                Data da adoção
              </Label>
              <Input id="animal-data-adocao" type="date" hasError={!!errors.dataAdocao} {...register("dataAdocao")} />
              <MensagemErro id="animal-data-adocao-erro" mensagem={errors.dataAdocao?.message} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="animal-cep" required>
                CEP
              </Label>
              <Controller
                control={control}
                name="cep"
                render={({ field }) => (
                  <Input
                    id="animal-cep"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={9}
                    placeholder="00000-000"
                    hasError={!!errors.cep}
                    value={field.value ?? ""}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    onChange={(evento) => {
                      const cepFormatado = formatCEP(evento.target.value);
                      field.onChange(cepFormatado);
                      void consultarCep(cepFormatado);
                    }}
                  />
                )}
              />
              <MensagemErro id="animal-cep-erro" mensagem={errors.cep?.message} />
              {!errors.cep && buscaCep.estado === "buscando" && (
                <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Buscando endereço...
                </p>
              )}
              {!errors.cep && buscaCep.estado === "encontrado" && (
                <p className="text-xs text-status-success-fg" role="status">
                  Endereço encontrado: {buscaCep.endereco}
                </p>
              )}
              {!errors.cep && buscaCep.estado === "nao-encontrado" && (
                <p className="text-xs text-muted-foreground" role="status">
                  CEP não encontrado. Confira o número ou preencha a localidade manualmente.
                </p>
              )}
              {!errors.cep && buscaCep.estado === "erro" && (
                <p className="text-xs text-muted-foreground" role="status">
                  Não foi possível consultar o CEP agora. Preencha a localidade manualmente.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="animal-localidade" required>
                Localidade
              </Label>
              <Input
                id="animal-localidade"
                placeholder="Ex: Teófilo Otoni - MG"
                hasError={!!errors.localidade}
                {...register("localidade")}
              />
              <MensagemErro id="animal-localidade-erro" mensagem={errors.localidade?.message} />
            </div>
          </>
        )}

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
            {passo === 0 ? (
              <Button key="proximo" type="submit" className="gap-1.5">
                Próximo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button key="cadastrar" type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Cadastrar animal"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
