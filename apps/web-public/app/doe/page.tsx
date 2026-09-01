import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { PixCard } from "@/features/donations/components/pix-card";
import { UrgencyList } from "@/features/donations/components/urgency-list";
import { MapEmbed } from "@/features/donations/components/map-embed";
import { CollectionPointsList } from "@/features/donations/components/collection-points-list";
import { URGENCIES } from "@/features/donations/data/urgencies";
import { COLLECTION_POINTS } from "@/features/donations/data/collection-points";

export const metadata: Metadata = { title: "Central de Ajuda — AmeMais" };

export default function DoePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-11 pb-15">
      <PageHeader
        eyebrow="Central de ajuda"
        title="Cada real vira ração, vacina e resgate."
        description="Somos mantidos 100% por doações. Escolha a forma que funciona melhor para você."
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-7">
        <PixCard />

        <div>
          <h2 className="mb-1.5 font-display text-4xl font-bold">Urgências da semana</h2>
          <p className="mb-3.5 text-lg text-muted-dark">Atualizado pela equipe toda segunda-feira.</p>
          <UrgencyList urgencies={URGENCIES} />
        </div>
      </div>

      <div className="mt-9">
        <h2 className="mb-1.5 font-display text-4xl font-bold">Doações físicas — pontos de coleta</h2>
        <p className="mb-4 text-lg text-muted-dark">
          Ração, cobertores, jornal, remédios e caixas de transporte. Deixe em qualquer parceiro abaixo, no horário
          comercial:
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-4">
          <MapEmbed height={260} />
          <div className="flex flex-col gap-2.5">
            <CollectionPointsList points={COLLECTION_POINTS} showHours />
            <p className="-rotate-1 font-display text-2xl text-primary">
              quer ser um ponto de coleta? chama a gente no WhatsApp!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
