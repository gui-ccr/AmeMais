"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AnimalForm } from "@/features/animais/components/animal-form";
import { AnimalList, type VisaoAnimais } from "@/features/animais/components/animal-list";
import { VisaoToggle } from "@/features/animais/components/visao-toggle";
import { useAnimais } from "@/features/animais/hooks/use-animais";

export default function AnimaisPage() {
  const [modalAberto, setModalAberto] = useState(false);
  const [visao, setVisao] = useState<VisaoAnimais>("grade");
  const { data: animais } = useAnimais();

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-secondary pb-6">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">Animais Cadastrados</h1>
          <p className="text-muted-foreground text-lg mt-1">
            Os animais já registrados pela ONG e as informações da adoção de cada um.
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

      <AnimalList visao={visao} onNovo={() => setModalAberto(true)} />

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Cadastrar novo animal</DialogTitle>
            <DialogDescription>Preencha os dados do animal e da adoção. Todos os campos são obrigatórios.</DialogDescription>
          </DialogHeader>
          <AnimalForm onFechar={() => setModalAberto(false)} />
        </DialogContent>
      </Dialog>
    </main>
  );
}
