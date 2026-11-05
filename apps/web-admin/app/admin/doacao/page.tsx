"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SomenteEscrita } from "@/features/auth/components/somente-escrita";
import { DoacaoForm } from "@/features/doacoes/components/doacao-form";
import { DoacaoList } from "@/features/doacoes/components/doacao-list";
import { DoacaoModal } from "@/features/doacoes/components/doacao-modal";
import { UrgenciaResumo } from "@/features/doacoes/components/urgencia-resumo";

export default function DoacoesPage() {
  const [registrando, setRegistrando] = useState(false);
  const [doacaoAbertaId, setDoacaoAbertaId] = useState<string | null>(null);
  const [urgenciaVistaId, setUrgenciaVistaId] = useState<string | null>(null);

  return (
    <section className="min-h-screen bg-background text-foreground p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-secondary pb-6">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">Doações</h1>
          <p className="text-muted-foreground text-lg mt-1">
            As doações físicas e em dinheiro recebidas pela ONG, avulsas ou ligadas a uma urgência.
          </p>
        </div>
        <SomenteEscrita modulo="doacoes">
          <Button className="gap-2" onClick={() => setRegistrando(true)}>
            <Plus className="h-4 w-4" />
            Registrar Doação
          </Button>
        </SomenteEscrita>
      </div>

      <DoacaoList
        onAbrir={(doacao) => setDoacaoAbertaId(doacao.id)}
        onVerUrgencia={setUrgenciaVistaId}
        onNova={() => setRegistrando(true)}
      />

      <Dialog open={registrando} onOpenChange={setRegistrando}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Registrar doação</DialogTitle>
            <DialogDescription>Registre uma doação recebida, física ou em dinheiro.</DialogDescription>
          </DialogHeader>
          <DoacaoForm onFechar={() => setRegistrando(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={doacaoAbertaId !== null} onOpenChange={(aberto) => !aberto && setDoacaoAbertaId(null)}>
        <DialogContent className="max-w-xl">
          {doacaoAbertaId && (
            <DoacaoModal key={doacaoAbertaId} doacaoId={doacaoAbertaId} onFechar={() => setDoacaoAbertaId(null)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={urgenciaVistaId !== null} onOpenChange={(aberto) => !aberto && setUrgenciaVistaId(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Urgência vinculada</DialogTitle>
            <DialogDescription>A urgência à qual esta doação está ligada.</DialogDescription>
          </DialogHeader>
          {urgenciaVistaId && <UrgenciaResumo urgenciaId={urgenciaVistaId} />}
          <div className="mt-5 flex justify-end">
            <Button type="button" variant="outline" onClick={() => setUrgenciaVistaId(null)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
