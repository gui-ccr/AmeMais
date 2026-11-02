"use client";

import { AlertTriangle, PawPrint, Plus, X } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { useAnimaisElegiveis, useDesvincularAnimal, useVincularAnimal } from "../hooks/use-lares";
import type { LarDetalhe } from "../types";

/** Minúsculas e sem acento, para "thor" achar "Thor". */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** "Sobram 2 vagas" / "Sobra 1 vaga" / "Lar cheio". */
export function textoDeVagasRestantes(vagas: number): string {
  if (vagas <= 0) return "Lar cheio: não há vagas";
  return vagas === 1 ? "Sobra 1 vaga" : `Sobram ${vagas} vagas`;
}

function Foto({ url, nome }: { url: string | null; nome: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- foto vinda do storage, tamanho fixo e pequeno
    <img src={url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
  ) : (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card-muted text-muted-dark"
      aria-hidden="true"
      title={nome}
    >
      <PawPrint className="h-5 w-5" />
    </span>
  );
}

interface PainelVincularProps {
  lar: LarDetalhe;
  onFechar: VoidFunction;
}

/** Busca entre os animais que podem ir para o lar (sem lar e não adotados) e vincula com um clique. */
function PainelVincular({ lar, onFechar }: PainelVincularProps) {
  const idBusca = useId();
  const { toast } = useToast();
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const elegiveis = useAnimaisElegiveis(true);
  const vincular = useVincularAnimal(lar.id);

  const cheio = lar.vagas <= 0;
  const termo = normalizar(busca.trim());
  const encontrados = (elegiveis.data ?? []).filter((animal) => !termo || normalizar(animal.nome).includes(termo));

  async function aoVincular(animalId: string, nome: string) {
    setErro(null);
    try {
      await vincular.mutateAsync(animalId);
      toast({ tipo: "sucesso", titulo: `${nome} agora mora neste lar` });
    } catch (e) {
      setErro(mensagemDeErroDaApi(e, "Não foi possível vincular o animal. Tente novamente."));
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-border-subtle bg-card-muted p-3">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={idBusca} size="sm">
          Buscar animal disponível
        </Label>
        <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={onFechar}>
          <X className="h-4 w-4" aria-hidden="true" />
          Fechar busca
        </Button>
      </div>
      <Input
        id={idBusca}
        type="search"
        inputSize="sm"
        variant="outline"
        placeholder="Nome do animal"
        autoComplete="off"
        value={busca}
        onChange={(evento) => setBusca(evento.target.value)}
      />

      {erro && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {erro}
        </p>
      )}

      {elegiveis.isPending ? (
        <p className="text-sm text-muted-foreground" aria-busy="true">
          Carregando animais...
        </p>
      ) : elegiveis.isError ? (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {mensagemDeErroDaApi(elegiveis.error, "Não foi possível carregar os animais.")}
          </p>
          <Button variant="outline" size="sm" onClick={() => elegiveis.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : encontrados.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {elegiveis.data.length === 0
            ? "Não há animais disponíveis para vincular: todos já têm lar ou foram adotados."
            : "Nenhum animal encontrado com essa busca."}
        </p>
      ) : (
        <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto" aria-label="Animais disponíveis">
          {encontrados.map((animal) => (
            <li
              key={animal.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-white p-2"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Foto url={animal.urlFoto} nome={animal.nome} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{animal.nome}</span>
                  {animal.especie && <span className="block text-xs text-muted-foreground">{animal.especie}</span>}
                </span>
              </span>
              <Button
                type="button"
                size="sm"
                disabled={cheio || vincular.isPending}
                aria-label={`Vincular ${animal.nome} ao lar`}
                onClick={() => aoVincular(animal.id, animal.nome)}
              >
                Vincular
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Aba "Animais" do lar: quem mora nele, vagas restantes, remover e vincular animal. */
export function LarAnimais({ lar }: { lar: LarDetalhe }) {
  const { toast } = useToast();
  const desvincular = useDesvincularAnimal(lar.id);
  const [vinculando, setVinculando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState<string | null>(null);

  const cheio = lar.vagas <= 0;
  const inativo = lar.status === "inativo";

  async function aoRemover(animalId: string, nome: string) {
    setErro(null);
    setRemovendo(animalId);
    try {
      await desvincular.mutateAsync(animalId);
      toast({ tipo: "sucesso", titulo: `${nome} saiu do lar`, descricao: "O animal voltou para disponível." });
    } catch (e) {
      setErro(mensagemDeErroDaApi(e, "Não foi possível remover o animal. Tente novamente."));
    } finally {
      setRemovendo(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-foreground" aria-live="polite">
          Ocupação: <strong>{`${lar.ocupacao} / ${lar.capacidade}`}</strong> ·{" "}
          <span className={cheio ? "font-medium text-destructive" : "font-medium text-status-success-fg"}>
            {textoDeVagasRestantes(lar.vagas)}
          </span>
        </p>
        <Button
          size="sm"
          className="gap-1.5"
          disabled={cheio || inativo || vinculando}
          title={cheio ? "O lar está cheio" : inativo ? "Lar inativo não recebe animais" : undefined}
          onClick={() => setVinculando(true)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Vincular animal
        </Button>
      </div>

      {vinculando && <PainelVincular lar={lar} onFechar={() => setVinculando(false)} />}

      {erro && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {erro}
        </p>
      )}

      {lar.animais.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border-subtle bg-card-muted p-6 text-center">
          <PawPrint className="h-8 w-8 text-muted-dark" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Nenhum animal neste lar.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Animais do lar">
          {lar.animais.map((animal) => (
            <li
              key={animal.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle p-2"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Foto url={animal.urlFoto} nome={animal.nome} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{animal.nome}</span>
                  {animal.especie && <span className="block text-xs text-muted-foreground">{animal.especie}</span>}
                </span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={desvincular.isPending}
                aria-label={`Remover ${animal.nome} do lar`}
                onClick={() => aoRemover(animal.id, animal.nome)}
              >
                {removendo === animal.id ? "Removendo..." : "Remover"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
