"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
  type FieldErrors,
  type FieldPath,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FotoDropzone } from "@/components/ui/foto-dropzone";
import { IndicadorDePassos } from "@/components/ui/indicador-de-passos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MensagemErro } from "@/components/ui/mensagem-erro";
import { Opcional } from "@/components/ui/opcional";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useUrgencias } from "@/features/urgencias/hooks/use-urgencias";
import { UNIDADE_INFO } from "@/features/urgencias/opcoes";
import { compararUrgencias, getSituacaoUrgencia } from "@/features/urgencias/situacao";
import { UNIDADES_META } from "@/features/urgencias/types";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { diaDeHoje, formatCPF, formatPhone } from "@/utils";
import { useCreateDoacao, useUpdateDoacao } from "../hooks/use-doacoes";
import { CATEGORIA_INFO } from "../opcoes";
import {
  DOACAO_FORM_VAZIO,
  VINCULOS,
  doacaoSchema,
  paraDadosDaDoacao,
  paraValoresDoFormulario,
  type DoacaoFormEntrada,
  type DoacaoFormSaida,
} from "../schema";
import { CATEGORIAS_DOACAO, type Doacao } from "../types";

const PASSOS = ["Doação", "Doador (opcional)"] as const;

/** Campos da etapa 1: são os que `Próximo` valida antes de deixar avançar. */
const CAMPOS_DA_DOACAO: FieldPath<DoacaoFormEntrada>[] = [
  "vinculo",
  "urgenciaId",
  "descricao",
  "quantidade",
  "unidade",
  "categoria",
  "localColeta",
  "dataEntrada",
  "foto",
];

const ROTULO_VINCULO: Record<(typeof VINCULOS)[number], string> = {
  avulsa: "Doação avulsa",
  urgencia: "Vincular a uma urgência",
};

/**
 * Etapa 2 do wizard: dados do doador. Todos opcionais — só são validados (telefone e
 * CPF) quando preenchidos. Precisa estar dentro de um `<FormProvider>` do formulário
 * de doação e de um grid de 2 colunas (devolve só as células).
 */
export function EtapaDoador() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<DoacaoFormEntrada>();

  return (
    <>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="doacao-doador-nome">
          Nome do doador <Opcional />
        </Label>
        <Input
          id="doacao-doador-nome"
          placeholder="Ex: Maria Souza"
          autoComplete="off"
          autoFocus
          {...register("doadorNome")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="doacao-doador-telefone">
          Telefone do doador <Opcional />
        </Label>
        <Controller
          control={control}
          name="doadorTelefone"
          render={({ field }) => (
            <Input
              id="doacao-doador-telefone"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              maxLength={15}
              placeholder="(00) 00000-0000"
              hasError={!!errors.doadorTelefone}
              value={field.value ?? ""}
              onBlur={field.onBlur}
              ref={field.ref}
              onChange={(evento) => field.onChange(formatPhone(evento.target.value))}
            />
          )}
        />
        <MensagemErro id="doacao-doador-telefone-erro" mensagem={errors.doadorTelefone?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="doacao-doador-cpf">
          CPF do doador <Opcional />
        </Label>
        <Controller
          control={control}
          name="doadorCpf"
          render={({ field }) => (
            <Input
              id="doacao-doador-cpf"
              inputMode="numeric"
              autoComplete="off"
              maxLength={14}
              placeholder="000.000.000-00"
              hasError={!!errors.doadorCpf}
              value={field.value ?? ""}
              onBlur={field.onBlur}
              ref={field.ref}
              onChange={(evento) => field.onChange(formatCPF(evento.target.value))}
            />
          )}
        />
        <MensagemErro id="doacao-doador-cpf-erro" mensagem={errors.doadorCpf?.message} />
      </div>
    </>
  );
}

interface DoacaoFormProps {
  /** Doação a editar. Sem ela, o formulário é de cadastro. */
  doacao?: Doacao;
  /** Chamado ao cancelar e depois de salvar (fechar o modal ou voltar para os detalhes). */
  onFechar: VoidFunction;
}

export function DoacaoForm({ doacao, onFechar }: DoacaoFormProps) {
  const emEdicao = !!doacao;
  const criarDoacao = useCreateDoacao();
  const atualizarDoacao = useUpdateDoacao();
  const { toast } = useToast();
  const { data: urgencias, isPending: carregandoUrgencias, isError: erroNasUrgencias, refetch, isRefetching } = useUrgencias();

  const [passo, setPasso] = useState(0);
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  // Foto que a doação já tem (edição): continua valendo até a pessoa escolher outra ou clicar em "Remover".
  const [fotoAtual, setFotoAtual] = useState<string | null>(doacao?.urlFoto ?? null);
  // Depois de uma tentativa de avançar/enviar com erro, cada alteração revalida o campo
  // na hora (o RHF só faz isso sozinho depois de um submit, e aqui a etapa 1 usa `trigger`).
  const [revalidarAoDigitar, setRevalidarAoDigitar] = useState(false);

  const metodos = useForm<DoacaoFormEntrada, unknown, DoacaoFormSaida>({
    resolver: zodResolver(doacaoSchema),
    defaultValues: doacao ? paraValoresDoFormulario(doacao) : { ...DOACAO_FORM_VAZIO, dataEntrada: diaDeHoje() },
  });
  const {
    register,
    control,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors, dirtyFields },
  } = metodos;

  const vinculo = useWatch({ control, name: "vinculo" });
  const urgenciaEscolhida = useWatch({ control, name: "urgenciaId" });
  const urgenciasOrdenadas = urgencias ? [...urgencias].sort((a, b) => compararUrgencias(a, b)) : [];
  const urgenciaVinculadaSumiu =
    vinculo === "urgencia" && !!urgenciaEscolhida && !!urgencias && !urgencias.some((u) => u.id === urgenciaEscolhida);

  useEffect(() => {
    if (!revalidarAoDigitar) return;

    const inscricao = watch((_valores, { name }) => {
      if (name) void trigger(name);
    });
    return () => inscricao.unsubscribe();
  }, [revalidarAoDigitar, watch, trigger]);

  async function avancar() {
    const valido = await trigger(CAMPOS_DA_DOACAO, { shouldFocus: true });
    if (valido) {
      // A etapa do doador começa "limpa": só mostra erro depois de uma tentativa de enviar.
      setRevalidarAoDigitar(false);
      setPasso(1);
    } else {
      setRevalidarAoDigitar(true);
    }
  }

  // Só volta para a etapa 1 se algum campo dela estiver inválido ao enviar.
  function aoInvalidar(erros: FieldErrors<DoacaoFormEntrada>) {
    setRevalidarAoDigitar(true);
    if (CAMPOS_DA_DOACAO.some((campo) => campo in erros)) setPasso(0);
  }

  async function onSubmit(values: DoacaoFormSaida) {
    setErroServidor(null);
    const dados = paraDadosDaDoacao(values);

    try {
      if (doacao) {
        await atualizarDoacao.mutateAsync({
          id: doacao.id,
          // Foto: arquivo novo troca; sem arquivo novo, mantém a atual (undefined) ou remove (null) se a pessoa a removeu.
          input: { ...dados, foto: values.foto ?? (fotoAtual ? undefined : null) },
        });
        toast({ tipo: "sucesso", titulo: "Doação atualizada!", descricao: dados.descricao });
      } else {
        // "Registrado por" é gravado pelo servidor a partir do usuário autenticado.
        await criarDoacao.mutateAsync({ ...dados, foto: values.foto });
        toast({ tipo: "sucesso", titulo: "Doação registrada com sucesso!", descricao: dados.descricao });
      }
      onFechar();
    } catch (erro) {
      setErroServidor(mensagemDeErroDaApi(erro, "Não foi possível salvar a doação. Tente novamente."));
    }
  }

  const salvando = criarDoacao.isPending || atualizarDoacao.isPending;

  return (
    <div>
      <IndicadorDePassos passos={PASSOS} passoAtual={passo} />
      <p className="mb-4 text-sm text-muted-foreground">
        {passo === 0
          ? "Os campos marcados com * são obrigatórios; a foto é opcional."
          : "Todos os dados do doador são opcionais. Preencha só se ele quiser ser identificado."}
      </p>

      <FormProvider {...metodos}>
        <form
          noValidate
          onSubmit={(evento) => {
            // Enter na primeira etapa avança em vez de enviar o registro.
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
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label id="doacao-vinculo-rotulo" required>
                  Vínculo
                </Label>
                <Controller
                  control={control}
                  name="vinculo"
                  render={({ field }) => (
                    <div role="radiogroup" aria-labelledby="doacao-vinculo-rotulo" className="flex flex-wrap gap-2">
                      {VINCULOS.map((opcao) => (
                        <Button
                          key={opcao}
                          type="button"
                          size="sm"
                          role="radio"
                          aria-checked={field.value === opcao}
                          variant={field.value === opcao ? "chip-active" : "chip"}
                          onClick={() => field.onChange(opcao)}
                        >
                          {ROTULO_VINCULO[opcao]}
                        </Button>
                      ))}
                    </div>
                  )}
                />
                <MensagemErro id="doacao-vinculo-erro" mensagem={errors.vinculo?.message} />
              </div>

              {vinculo === "urgencia" && (
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label htmlFor="doacao-urgencia" required>
                    Urgência
                  </Label>
                  <Controller
                    control={control}
                    name="urgenciaId"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        disabled={carregandoUrgencias || erroNasUrgencias}
                      >
                        <SelectTrigger id="doacao-urgencia" hasError={!!errors.urgenciaId}>
                          <SelectValue placeholder={carregandoUrgencias ? "Carregando urgências..." : "Selecione a urgência"} />
                        </SelectTrigger>
                        <SelectContent>
                          {urgenciasOrdenadas.map((urgencia) => (
                            <SelectItem key={urgencia.id} value={urgencia.id}>
                              {urgencia.titulo}
                              {getSituacaoUrgencia(urgencia).chave === "atendida" ? " (atendida)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <MensagemErro id="doacao-urgencia-erro" mensagem={errors.urgenciaId?.message} />
                  {erroNasUrgencias && (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" role="status">
                      Não foi possível carregar as urgências.
                      <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
                        {isRefetching ? "Tentando..." : "Tentar novamente"}
                      </Button>
                    </div>
                  )}
                  {urgencias && urgencias.length === 0 && (
                    <p className="text-xs text-muted-foreground" role="status">
                      Nenhuma urgência cadastrada. Cadastre uma no módulo de urgências ou registre como doação avulsa.
                    </p>
                  )}
                  {urgenciaVinculadaSumiu && (
                    <p className="text-xs text-muted-foreground" role="status">
                      A urgência vinculada a esta doação não está mais cadastrada. Escolha outra ou mude para doação avulsa.
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="doacao-descricao" required>
                  Descrição do que foi doado
                </Label>
                <Input
                  id="doacao-descricao"
                  placeholder="Ex: 3 sacos de ração filhote"
                  hasError={!!errors.descricao}
                  {...register("descricao")}
                />
                <MensagemErro id="doacao-descricao-erro" mensagem={errors.descricao?.message} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="doacao-categoria" required>
                  Categoria
                </Label>
                <Controller
                  control={control}
                  name="categoria"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(valor) => {
                        field.onChange(valor);
                        // Só sugere a unidade ao cadastrar e enquanto a pessoa não escolheu uma à mão.
                        if (!emEdicao && !dirtyFields.unidade) {
                          setValue("unidade", CATEGORIA_INFO[valor as keyof typeof CATEGORIA_INFO].unidadeSugerida);
                        }
                      }}
                    >
                      <SelectTrigger id="doacao-categoria" hasError={!!errors.categoria}>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS_DOACAO.map((categoria) => (
                          <SelectItem key={categoria} value={categoria}>
                            {CATEGORIA_INFO[categoria].rotulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <MensagemErro id="doacao-categoria-erro" mensagem={errors.categoria?.message} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="doacao-data-entrada" required>
                  Data de entrada
                </Label>
                <Input
                  id="doacao-data-entrada"
                  type="date"
                  max={diaDeHoje()}
                  hasError={!!errors.dataEntrada}
                  {...register("dataEntrada")}
                />
                <MensagemErro id="doacao-data-entrada-erro" mensagem={errors.dataEntrada?.message} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="doacao-quantidade" required>
                  Quantidade
                </Label>
                <Input
                  id="doacao-quantidade"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  placeholder="Ex: 3"
                  hasError={!!errors.quantidade}
                  {...register("quantidade")}
                />
                <MensagemErro id="doacao-quantidade-erro" mensagem={errors.quantidade?.message} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="doacao-unidade" required>
                  Unidade
                </Label>
                <Controller
                  control={control}
                  name="unidade"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="doacao-unidade">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIDADES_META.map((unidade) => (
                          <SelectItem key={unidade} value={unidade}>
                            {UNIDADE_INFO[unidade].rotulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="doacao-local-coleta" required>
                  Onde foi coletada
                </Label>
                <Input
                  id="doacao-local-coleta"
                  placeholder="Ex: Pet Shop Amigo Fiel"
                  hasError={!!errors.localColeta}
                  {...register("localColeta")}
                />
                <MensagemErro id="doacao-local-coleta-erro" mensagem={errors.localColeta?.message} />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="doacao-foto">
                  Foto <Opcional />
                </Label>
                <Controller
                  control={control}
                  name="foto"
                  render={({ field }) => (
                    <FotoDropzone
                      id="doacao-foto"
                      value={field.value ?? null}
                      hasError={!!errors.foto}
                      urlAtual={fotoAtual}
                      onRemoverAtual={() => setFotoAtual(null)}
                      onChange={(arquivo) => {
                        field.onChange(arquivo);
                        // Avisa na hora se o arquivo escolhido não serve (tipo/tamanho).
                        if (arquivo) void trigger("foto");
                      }}
                    />
                  )}
                />
                <MensagemErro id="doacao-foto-erro" mensagem={errors.foto?.message} />
              </div>
            </>
          )}

          {passo === 1 && <EtapaDoador />}

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
                <Button key="registrar" type="submit" disabled={salvando}>
                  {salvando ? "Salvando..." : emEdicao ? "Salvar alterações" : "Registrar doação"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
