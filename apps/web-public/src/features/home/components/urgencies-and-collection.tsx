import Link from "next/link";
import { UrgencyList } from "@/features/donations/components/urgency-list";
import { MapEmbed } from "@/features/donations/components/map-embed";
import { CollectionPointsList } from "@/features/donations/components/collection-points-list";
import { CollectionPointsNotice, UrgenciesNotice } from "@/features/donations/components/donation-notices";
import { loadCollectionPoints, loadUrgencies } from "@/features/donations/api/get-donations-data";

export async function UrgenciesAndCollection() {
  const [urgencies, points] = await Promise.all([loadUrgencies(), loadCollectionPoints()]);

  return (
    <section className="bg-brand-sand">
      <div className="mx-auto grid max-w-6xl grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-9 px-6 py-13.5">
        <div>
          <h2 className="mb-1.5 font-display text-4xl font-bold">Urgências da semana</h2>
          <p className="mb-4 text-lg text-muted-dark">O que estamos precisando agora — atualizado pela equipe.</p>
          {urgencies.items.length === 0 ? (
            <UrgenciesNotice unavailable={urgencies.unavailable} />
          ) : (
            <UrgencyList urgencies={urgencies.items} />
          )}
          <Link
            href="/doe"
            className="mt-1 inline-block rounded-full bg-primary px-6.5 py-2.5 text-xl text-white no-underline hover:bg-primary-hover hover:text-white"
          >
            Quero ajudar com isso
          </Link>
        </div>
        <div>
          <h2 className="mb-1.5 font-display text-4xl font-bold">Pontos de coleta</h2>
          <p className="mb-4 text-lg text-muted-dark">
            Deixe ração, cobertores e remédios em qualquer um destes parceiros:
          </p>
          <MapEmbed />
          <div className="mt-3">
            {points.items.length === 0 ? (
              <CollectionPointsNotice unavailable={points.unavailable} />
            ) : (
              <CollectionPointsList points={points.items} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
