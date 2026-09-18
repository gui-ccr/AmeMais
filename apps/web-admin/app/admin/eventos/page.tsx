"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EventoForm } from "@/features/eventos/components/evento-form";
import { EventoList } from "@/features/eventos/components/evento-list";
import type { EventDTO as EventoType } from "@/features/eventos/types";

export default function EventosPage() {
  const [eventoEmEdicao, setEventoEmEdicao] = useState<EventoType | null>(null);

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-secondary pb-6">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Agenda de Eventos
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Feiras de adoção, mutirões e bazares beneficentes organizados pela ONG.
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline" size="sm">
            ← Voltar ao Admin
          </Button>
        </Link>
      </div>

      <section className="bg-card rounded-2xl border-2 border-secondary p-6 md:p-8 flex flex-col gap-6 shadow-sm">
        <EventoForm
          eventoParaEditar={eventoEmEdicao}
          onCancelarEdicao={() => setEventoEmEdicao(null)}
        />

        <div className="border-t border-border-subtle pt-6">
          <EventoList onEditar={setEventoEmEdicao} />
        </div>
      </section>
    </main>
  );
}
