"use client";

import { Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SomenteEscrita } from "@/features/auth/components/somente-escrita";
import { usePermissoes } from "@/features/auth/hooks/use-permissoes";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LarDetalhe } from "@/features/lares/components/lar-detalhe";
import { LarForm } from "@/features/lares/components/lar-form";
import { LarList } from "@/features/lares/components/lar-list";

function LaresConteudo() {
  const router = useRouter();
  const { podeEditar } = usePermissoes();
  const searchParams = useSearchParams();
  // `?lar=<id>`: link vindo de outra tela (ex.: voluntários) que já abre os detalhes desse lar.
  const larDaUrl = searchParams.get("lar");

  const [cadastrando, setCadastrando] = useState(false);
  const [larAberto, setLarAberto] = useState<string | null>(larDaUrl);

  // Navegar para outro `?lar=` com a página já aberta também abre o modal.
  useEffect(() => {
    if (larDaUrl) setLarAberto(larDaUrl);
  }, [larDaUrl]);

  function fecharDetalhe() {
    setLarAberto(null);
    // Tira o `?lar=` da URL: senão recarregar a página reabriria o modal.
    if (larDaUrl) router.replace("/admin/lares");
  }

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
        <SomenteEscrita modulo="lares">
          <Button className="gap-2 shrink-0" onClick={() => setCadastrando(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo lar
          </Button>
        </SomenteEscrita>
      </div>

      <LarList onNovo={podeEditar("lares") ? () => setCadastrando(true) : undefined} onAbrir={setLarAberto} />

      <Dialog open={cadastrando} onOpenChange={setCadastrando}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo lar</DialogTitle>
            <DialogDescription>Cadastre uma casa que vai abrigar animais. O lar entra como disponível.</DialogDescription>
          </DialogHeader>
          <LarForm onFechar={() => setCadastrando(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={larAberto !== null} onOpenChange={(aberto) => !aberto && fecharDetalhe()}>
        <DialogContent className="max-w-2xl">
          {larAberto && <LarDetalhe key={larAberto} larId={larAberto} onFechar={fecharDetalhe} />}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default function LaresPage() {
  // `useSearchParams` exige Suspense no build do Next.
  return (
    <Suspense>
      <LaresConteudo />
    </Suspense>
  );
}
