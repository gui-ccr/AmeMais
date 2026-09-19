"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UrgenciaForm } from "@/features/urgencias/components/urgencia-form";
import { UrgenciaList } from "@/features/urgencias/components/urgencia-list";
import type { Urgencia } from "@/features/urgencias/types";

export default function UrgenciasPage() {
  const [modalAberto, setModalAberto] = useState(false);
  const [urgenciaEmEdicao, setUrgenciaEmEdicao] = useState<Urgencia | null>(null);

  function abrirCriacao() {
    setUrgenciaEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(urgencia: Urgencia) {
    setUrgenciaEmEdicao(urgencia);
    setModalAberto(true);
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-secondary pb-6">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Mural de Urgências
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            O que a ONG mais precisa arrecadar nesta semana.
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="gap-2" onClick={abrirCriacao}>
            <Plus className="h-4 w-4" />
            Nova urgência
          </Button>
          <Link href="/admin">
            <Button variant="outline" size="sm">
              ← Voltar ao Admin
            </Button>
          </Link>
        </div>
      </div>

      <UrgenciaList onEditar={abrirEdicao} onNovo={abrirCriacao} />

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{urgenciaEmEdicao ? "Editar urgência" : "Nova urgência"}</DialogTitle>
          </DialogHeader>
          <UrgenciaForm urgenciaParaEditar={urgenciaEmEdicao} onFechar={() => setModalAberto(false)} />
        </DialogContent>
      </Dialog>
    </main>
  );
}
