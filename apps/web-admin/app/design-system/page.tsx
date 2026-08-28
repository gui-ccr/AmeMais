"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export default function DesignSystemPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [animalName, setAnimalName] = useState("");
  const [animalEspecie, setAnimalEspecie] = useState("cachorro");
  const [animalStatus, setAnimalStatus] = useState("adocao");
  const [hasErrorExample, setHasErrorExample] = useState(false);

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-secondary pb-6">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Design System AmeMais
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Catálogo de componentes atômicos: <span className="font-semibold text-foreground">Badge</span>, <span className="font-semibold text-foreground">Input</span>, <span className="font-semibold text-foreground">Select</span> e <span className="font-semibold text-foreground">Label</span>.
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline" size="sm">
            ← Voltar ao Admin
          </Button>
        </Link>
      </div>

      {/* 1. SEÇÃO BADGES (STATUS & MARCA) */}
      <section className="bg-card rounded-2xl border-2 border-secondary p-6 md:p-8 flex flex-col gap-6 shadow-sm">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground">
            1. Badges (Selo de Status & Marca)
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Componente para representar status operacionais da ONG (adoção, tratamento, resgatado, etc.) e tags visuais.
          </p>
        </div>

        {/* Status da ONG */}
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-foreground uppercase tracking-wide">
            Status da ONG (Variações Semânticas)
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="adocao" dot>Disponível para Adoção</Badge>
            <Badge variant="tratamento" dot>Em Tratamento</Badge>
            <Badge variant="resgatado" dot>Recém Resgatado</Badge>
            <Badge variant="neutral" dot>Adotado</Badge>
            <Badge variant="urgent" dot>Urgente</Badge>
            <Badge variant="destructive">Cirurgia Pendente</Badge>
          </div>
        </div>

        {/* Variantes de Marca */}
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-foreground uppercase tracking-wide">
            Variantes de Marca & Tema
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="primary">Terracota (Primary)</Badge>
            <Badge variant="secondary">Charcoal (Secondary)</Badge>
            <Badge variant="outline">Outline 2px</Badge>
            <Badge variant="muted">Muted Tag</Badge>
          </div>
        </div>

        {/* Tamanhos */}
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-foreground uppercase tracking-wide">
            Tamanhos
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <Badge size="sm" variant="adocao" dot>Pequeno (sm)</Badge>
            <Badge size="default" variant="adocao" dot>Padrão (default)</Badge>
            <Badge size="lg" variant="adocao" dot>Grande (lg)</Badge>
          </div>
        </div>
      </section>

      {/* 2. SEÇÃO INPUTS */}
      <section className="bg-card rounded-2xl border-2 border-secondary p-6 md:p-8 flex flex-col gap-6 shadow-sm">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground">
            2. Inputs (Campos de Entrada)
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Campos de formulário estilizados com os tokens de borda, cantos arredondados e anel de foco terracota.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="input-default">Input Padrão (Default - rounded-xl)</Label>
            <Input
              id="input-default"
              placeholder="Digite o nome do animal..."
              value={animalName}
              onChange={(e) => setAnimalName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="input-pill">Input Pill (Busca / rounded-full)</Label>
            <Input
              id="input-pill"
              variant="pill"
              placeholder="🔍 Buscar por nome, espécie, microchip..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="input-error" required>Input com Estado de Erro</Label>
              <button
                type="button"
                onClick={() => setHasErrorExample(!hasErrorExample)}
                className="text-xs text-primary underline cursor-pointer"
              >
                {hasErrorExample ? "Remover erro" : "Simular erro"}
              </button>
            </div>
            <Input
              id="input-error"
              hasError={hasErrorExample}
              placeholder="Campo com validação..."
              defaultValue="Valor inválido informado"
            />
            {hasErrorExample && (
              <p className="text-xs text-destructive font-medium">
                Este campo é obrigatório ou possui formato inválido.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="input-disabled">Input Desabilitado</Label>
            <Input
              id="input-disabled"
              disabled
              value="Campo somente leitura / desabilitado"
            />
          </div>
        </div>

        {/* Variações de Tamanho */}
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-foreground uppercase tracking-wide">
            Tamanhos de Input
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label size="sm">Pequeno (sm)</Label>
              <Input inputSize="sm" placeholder="Input sm..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label size="default">Padrão (default)</Label>
              <Input inputSize="default" placeholder="Input default..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label size="lg">Grande (lg)</Label>
              <Input inputSize="lg" placeholder="Input lg..." />
            </div>
          </div>
        </div>
      </section>

      {/* 3. SEÇÃO SELECTS */}
      <section className="bg-card rounded-2xl border-2 border-secondary p-6 md:p-8 flex flex-col gap-6 shadow-sm">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground">
            3. Selects (Seleção com Chevron Integrado)
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Seleção nativa acessível com ícone chevron customizado e harmonia visual com os inputs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="select-especie" required>Espécie do Animal</Label>
            <Select
              id="select-especie"
              value={animalEspecie}
              onChange={(e) => setAnimalEspecie(e.target.value)}
            >
              <option value="cachorro">🐶 Cachorro</option>
              <option value="gato">🐱 Gato</option>
              <option value="outro">🐾 Outro animal</option>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="select-status" required>Status de Adoção</Label>
            <Select
              id="select-status"
              value={animalStatus}
              onChange={(e) => setAnimalStatus(e.target.value)}
            >
              <option value="adocao">🟢 Disponível para adoção</option>
              <option value="tratamento">🟡 Em tratamento</option>
              <option value="resgatado">🔴 Recém resgatado</option>
              <option value="adotado">⚪ Adotado</option>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="select-pill">Select Variante Pill</Label>
            <Select id="select-pill" variant="pill">
              <option value="todos">Todos os portes</option>
              <option value="pequeno">Porte Pequeno</option>
              <option value="medio">Porte Médio</option>
              <option value="grande">Porte Grande</option>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="select-disabled">Select Desabilitado</Label>
            <Select id="select-disabled" disabled value="fixo">
              <option value="fixo">Opção bloqueada</option>
            </Select>
          </div>
        </div>
      </section>

      {/* 4. FORMULÁRIO DE TESTE INTEGRADO */}
      <section className="bg-card rounded-2xl border-2 border-secondary p-6 md:p-8 flex flex-col gap-6 shadow-sm">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground">
            4. Teste Integrado: Cadastro Rápido de Animal
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Exemplo real de formulário combinando Label, Input, Select, Badge e Button.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert(`Animal ${animalName || "Sem Nome"} cadastrado com sucesso!`);
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="form-nome" required>Nome do Animal</Label>
            <Input
              id="form-nome"
              required
              placeholder="Ex: Pipoca, Thor, Mel..."
              value={animalName}
              onChange={(e) => setAnimalName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="form-especie" required>Espécie</Label>
            <Select
              id="form-especie"
              value={animalEspecie}
              onChange={(e) => setAnimalEspecie(e.target.value)}
            >
              <option value="cachorro">Cachorro</option>
              <option value="gato">Gato</option>
              <option value="outro">Outro</option>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="form-status" required>Status Inicial</Label>
            <Select
              id="form-status"
              value={animalStatus}
              onChange={(e) => setAnimalStatus(e.target.value)}
            >
              <option value="adocao">Disponível para Adoção</option>
              <option value="tratamento">Em Tratamento</option>
              <option value="resgatado">Recém Resgatado</option>
              <option value="adotado">Adotado</option>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Pré-visualização do Status</Label>
            <div className="h-11 flex items-center">
              <Badge
                variant={
                  animalStatus === "adocao"
                    ? "adocao"
                    : animalStatus === "tratamento"
                    ? "tratamento"
                    : animalStatus === "resgatado"
                    ? "resgatado"
                    : "neutral"
                }
                dot
                size="default"
              >
                {animalStatus === "adocao" && "Disponível para Adoção"}
                {animalStatus === "tratamento" && "Em Tratamento"}
                {animalStatus === "resgatado" && "Recém Resgatado"}
                {animalStatus === "adotado" && "Adotado"}
              </Badge>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAnimalName("");
                setAnimalEspecie("cachorro");
                setAnimalStatus("adocao");
              }}
            >
              Limpar
            </Button>
            <Button type="submit">
              Salvar Animal
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
