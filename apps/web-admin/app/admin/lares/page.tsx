"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LarForm } from "@/features/lares/components/lar-form";
import { LarList } from "@/features/lares/components/lar-list";

export default function LaresPage() {
  const [cadastrando, setCadastrando] = useState(false);

  return (
    <section className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-12 max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-secondary pb-6">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">Lares Temporários</h1>
          <p className="text-muted-foreground text-lg mt-1">
            As casas que abrigam os animais até a adoção: quem é o responsável, quantas vagas sobram e como está cada
            lar.
          </p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setCadastrando(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Novo lar
        </Button>
      </div>

      <LarList onNovo={() => setCadastrando(true)} onAbrir={() => {}} />

      <Dialog open={cadastrando} onOpenChange={setCadastrando}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo lar</DialogTitle>
            <DialogDescription>Cadastre uma casa que vai abrigar animais. O lar entra como disponível.</DialogDescription>
          </DialogHeader>
          <LarForm onFechar={() => setCadastrando(false)} />
        </DialogContent>
      </Dialog>
    </section>
  );
}
