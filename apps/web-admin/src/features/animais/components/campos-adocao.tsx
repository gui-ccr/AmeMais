"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CepNaoEncontradoError, buscarCep } from "@/lib/viacep";
import { diaDeHoje, formatCEP } from "@/utils";
import type { AdocaoFormEntrada } from "../adocao";
import { MensagemErro } from "./mensagem-erro";

type BuscaCep =
  | { estado: "ocioso" }
  | { estado: "buscando" }
  | { estado: "encontrado"; endereco: string }
  | { estado: "nao-encontrado" }
  | { estado: "erro" };

interface CamposAdocaoProps {
  /** Leva o foco para o primeiro campo ao aparecer (a etapa 2 do cadastro). */
  focarAoMontar?: boolean;
}

/**
 * Campos da adoção (adotante, data, CEP e localidade), com busca de CEP no ViaCEP.
 * Precisa estar dentro de um `<FormProvider>` cujo formulário tenha os campos de
 * `AdocaoFormEntrada`, e dentro de um grid de 2 colunas (devolve só as células).
 */
export function CamposAdocao({ focarAoMontar = false }: CamposAdocaoProps) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<AdocaoFormEntrada>();
  const [buscaCep, setBuscaCep] = useState<BuscaCep>({ estado: "ocioso" });
  const controladorCep = useRef<AbortController | null>(null);

  // Cancela uma consulta de CEP em andamento se os campos saírem da tela.
  useEffect(() => () => controladorCep.current?.abort(), []);

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

  return (
    <>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="animal-adotante-nome" required>
          Nome do adotante
        </Label>
        <Input
          id="animal-adotante-nome"
          placeholder="Ex: Maria Souza"
          autoFocus={focarAoMontar}
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
        <Input
          id="animal-data-adocao"
          type="date"
          max={diaDeHoje()}
          hasError={!!errors.dataAdocao}
          {...register("dataAdocao")}
        />
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
  );
}
