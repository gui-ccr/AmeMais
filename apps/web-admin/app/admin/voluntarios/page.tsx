"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VoluntarioForm } from "@/features/voluntarios/components/voluntario-form";
import { VoluntarioList } from "@/features/voluntarios/components/voluntario-list";

export default function VoluntariosPage() {
  const [cadastrando, setCadastrando] = useState(false);

  return (
    <section className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-secondary pb-6">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">Rede de Voluntários</h1>
          <p className="text-muted-foreground text-lg mt-1">
            As pessoas que ajudam a ONG: como entrar em contato, como cada uma ajuda e quem abriga animais em casa.
          </p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setCadastrando(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Novo voluntário
        </Button>
      </div>

      <VoluntarioList onNovo={() => setCadastrando(true)} />

      <Dialog open={cadastrando} onOpenChange={setCadastrando}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo voluntário</DialogTitle>
            <DialogDescription>
              Cadastre uma pessoa que vai ajudar a ONG. Ela entra como voluntária ativa.
            </DialogDescription>
          </DialogHeader>
          <VoluntarioForm onFechar={() => setCadastrando(false)} />
        </DialogContent>
      </Dialog>
    </section>
  );
}
