"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EventoForm } from "@/features/eventos/components/evento-form";
import { EventoList } from "@/features/eventos/components/evento-list";
import type { Evento } from "@/features/eventos/types";
import { UrgenciaForm } from "@/features/urgencias/components/urgencia-form";
import { UrgenciaList } from "@/features/urgencias/components/urgencia-list";
import type { Urgencia } from "@/features/urgencias/types";

export default function EventosPage() {
  const [eventoEmEdicao, setEventoEmEdicao] = useState<Evento | null>(null);
  const [urgenciaEmEdicao, setUrgenciaEmEdicao] = useState<Urgencia | null>(null);

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-secondary pb-6">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Eventos e Urgências
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Agenda de ações da ONG e mural de necessidades urgentes da semana.
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline" size="sm">
            ← Voltar ao Admin
          </Button>
        </Link>
      </div>

      <section className="bg-card rounded-2xl border-2 border-secondary p-6 md:p-8 flex flex-col gap-6 shadow-sm">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground">Agenda de Eventos</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Feiras de adoção, mutirões e bazares beneficentes organizados pela ONG.
          </p>
        </div>

        <EventoForm
          eventoParaEditar={eventoEmEdicao}
          onCancelarEdicao={() => setEventoEmEdicao(null)}
        />

        <div className="border-t border-border-subtle pt-6">
          <EventoList onEditar={setEventoEmEdicao} />
        </div>
      </section>

      <section className="bg-card rounded-2xl border-2 border-secondary p-6 md:p-8 flex flex-col gap-6 shadow-sm">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground">Mural de Urgências</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            O que a ONG mais precisa arrecadar nesta semana.
          </p>
        </div>

        <UrgenciaForm
          urgenciaParaEditar={urgenciaEmEdicao}
          onCancelarEdicao={() => setUrgenciaEmEdicao(null)}
        />

        <div className="border-t border-border-subtle pt-6">
          <UrgenciaList onEditar={setUrgenciaEmEdicao} />
        </div>
      </section>
    </main>
  );
}
