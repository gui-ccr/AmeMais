"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EventoForm } from "@/features/eventos/components/evento-form";
import { EventoList } from "@/features/eventos/components/evento-list";
import type { EventDTO } from "@/features/eventos/types";

export default function EventosPage() {
  const [modalAberto, setModalAberto] = useState(false);
  const [eventoEmEdicao, setEventoEmEdicao] = useState<EventDTO | null>(null);

  function abrirCriacao() {
    setEventoEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(evento: EventDTO) {
    setEventoEmEdicao(evento);
    setModalAberto(true);
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-secondary pb-6">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Agenda de Eventos
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Feiras de adoção, mutirões e bazares beneficentes organizados pela ONG.
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="gap-2" onClick={abrirCriacao}>
            <Plus className="h-4 w-4" />
            Novo evento
          </Button>
          <Link href="/admin">
            <Button variant="outline" size="sm">
              ← Voltar ao Admin
            </Button>
          </Link>
        </div>
      </div>

      <EventoList onEditar={abrirEdicao} onNovo={abrirCriacao} />

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{eventoEmEdicao ? "Editar evento" : "Novo evento"}</DialogTitle>
          </DialogHeader>
          <EventoForm eventoParaEditar={eventoEmEdicao} onFechar={() => setModalAberto(false)} />
        </DialogContent>
      </Dialog>
    </main>
  );
}
