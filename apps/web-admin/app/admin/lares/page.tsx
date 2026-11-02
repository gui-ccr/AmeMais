"use client";

import { LarList } from "@/features/lares/components/lar-list";

export default function LaresPage() {
  return (
    <section className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-12 max-w-6xl mx-auto flex flex-col gap-8">
      <div className="border-b-2 border-secondary pb-6">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">Lares Temporários</h1>
        <p className="text-muted-foreground text-lg mt-1">
          As casas que abrigam os animais até a adoção: quem é o responsável, quantas vagas sobram e como está cada lar.
        </p>
      </div>

      <LarList onAbrir={() => {}} />
    </section>
  );
}
