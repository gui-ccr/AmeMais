"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlterarStatusForm } from "@/features/animais/components/alterar-status-form";
import { AnimalDetalhes } from "@/features/animais/components/animal-detalhes";
import { AnimalForm } from "@/features/animais/components/animal-form";
import { AnimalList, type VisaoAnimais } from "@/features/animais/components/animal-list";
import { EditarAnimalForm } from "@/features/animais/components/editar-animal-form";
import { VisaoToggle } from "@/features/animais/components/visao-toggle";
import { useAnimais } from "@/features/animais/hooks/use-animais";
import type { Animal } from "@/features/animais/types";

export default function AnimaisPage() {
  const [modalAberto, setModalAberto] = useState(false);
  const [animalParaAlterar, setAnimalParaAlterar] = useState<Animal | null>(null);
  const [animalParaEditar, setAnimalParaEditar] = useState<Animal | null>(null);
  const [animalDetalhes, setAnimalDetalhes] = useState<Animal | null>(null);
  const [visao, setVisao] = useState<VisaoAnimais>("grade");
  const { data: animais } = useAnimais();

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-secondary pb-6">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">Animais Cadastrados</h1>
          <p className="text-muted-foreground text-lg mt-1">
            Os animais resgatados pela ONG, o status de cada um e as informações da adoção.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setModalAberto(true)}>
          <Plus className="h-4 w-4" />
          Cadastrar Novo Animal
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {animais ? `${animais.length} ${animais.length === 1 ? "animal cadastrado" : "animais cadastrados"}` : ""}
        </p>
        <VisaoToggle visao={visao} onChange={setVisao} />
      </div>

      <AnimalList
        visao={visao}
        onNovo={() => setModalAberto(true)}
        onVerDetalhes={setAnimalDetalhes}
        onEditar={setAnimalParaEditar}
        onAlterarStatus={setAnimalParaAlterar}
      />

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Cadastrar novo animal</DialogTitle>
            <DialogDescription>
              Registre o resgate. Se o animal já foi adotado, informe também os dados da adoção.
            </DialogDescription>
          </DialogHeader>
          <AnimalForm onFechar={() => setModalAberto(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={animalDetalhes !== null} onOpenChange={(aberto) => !aberto && setAnimalDetalhes(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{animalDetalhes?.nome}</DialogTitle>
            <DialogDescription>Dados do animal, como aparecem no cadastro e no site.</DialogDescription>
          </DialogHeader>
          {animalDetalhes && <AnimalDetalhes animal={animalDetalhes} />}
        </DialogContent>
      </Dialog>

      <Dialog open={animalParaEditar !== null} onOpenChange={(aberto) => !aberto && setAnimalParaEditar(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar animal</DialogTitle>
            <DialogDescription>
              Ajuste os dados do animal. O status é alterado em &quot;Alterar status&quot;.
            </DialogDescription>
          </DialogHeader>
          {animalParaEditar && (
            <EditarAnimalForm
              key={animalParaEditar.id}
              animal={animalParaEditar}
              onFechar={() => setAnimalParaEditar(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={animalParaAlterar !== null} onOpenChange={(aberto) => !aberto && setAnimalParaAlterar(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Alterar status</DialogTitle>
            <DialogDescription>{animalParaAlterar?.nome}</DialogDescription>
          </DialogHeader>
          {animalParaAlterar && (
            <AlterarStatusForm
              key={animalParaAlterar.id}
              animal={animalParaAlterar}
              onFechar={() => setAnimalParaAlterar(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
