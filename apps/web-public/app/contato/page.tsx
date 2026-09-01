import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { buildPageMetadata } from "@/lib/site";
import { ContactInfo } from "@/features/contact/components/contact-info";
import { MapEmbed } from "@/features/donations/components/map-embed";
import { CollectionPointsList } from "@/features/donations/components/collection-points-list";
import { COLLECTION_POINTS } from "@/features/donations/data/collection-points";

export const metadata: Metadata = buildPageMetadata({
  title: "Contato",
  description:
    "Fale com a AmeMais pelo WhatsApp para reportar um animal precisando de resgate, ou veja os pontos de coleta de doações físicas em Teófilo Otoni.",
  path: "/contato",
});

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-11 pb-15">
      <PageHeader
        eyebrow="Fale com a gente"
        title="Viu um animal precisando de ajuda?"
        description="Mande localização e foto pelo WhatsApp — é o jeito mais rápido de acionar a equipe de resgate."
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-7">
        <ContactInfo />
        <div>
          <MapEmbed height={250} />
          <div className="mt-3">
            <CollectionPointsList points={COLLECTION_POINTS} showHours />
          </div>
        </div>
      </div>
    </div>
  );
}
