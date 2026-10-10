import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { buildPageMetadata } from "@/lib/site";
import { AdoptionExplorer } from "@/features/adoption/components/adoption-explorer";
import { PetsNotice } from "@/features/adoption/components/pets-notice";
import { loadPets } from "@/features/adoption/api/get-pets";

export const metadata: Metadata = buildPageMetadata({
  title: "Adote um Amigo",
  description:
    "Conheça cães e gatos resgatados pela AmeMais e disponíveis para adoção em Teófilo Otoni, MG. Filtre por espécie, porte e idade — todos castrados, vacinados e vermifugados.",
  path: "/adote",
});

// Literal de propósito: o Next só lê esta opção se for um número escrito aqui (não importado).
// Mesmo valor de DEFAULT_REVALIDATE_SECONDS em src/lib/api.ts. Sem isto, uma página gerada
// quando a API estava fora do ar nunca seria atualizada. Ver ADR 0009.
export const revalidate = 30;

export default async function AdotePage() {
  const { pets, unavailable } = await loadPets();

  return (
    <div className="mx-auto max-w-6xl px-6 pt-11 pb-15">
      <PageHeader
        eyebrow="Adote um amigo"
        title="Eles já passaram pelo pior. Falta só a melhor parte: você."
        description="Todos os animais são castrados, vacinados e vermifugados antes da adoção. Use os filtros para encontrar seu companheiro."
      />

      {unavailable ? (
        <PetsNotice title="Não conseguimos carregar os animais agora">
          Tente de novo em alguns minutos, ou fale com a gente pelo WhatsApp que mostramos quem está esperando por um
          lar.
        </PetsNotice>
      ) : (
        <AdoptionExplorer pets={pets} />
      )}

      <div className="mt-7 flex flex-wrap items-center gap-4 rounded-2xl border-2 border-border bg-brand-sand p-5.5">
        <MessageCircle className="size-9 shrink-0 text-primary" />
        <div className="min-w-65 flex-1">
          <b className="text-xl">&quot;Quero conhecer&quot; abre nosso WhatsApp</b>
          <p className="text-lg text-muted-dark">
            Com mensagem pronta. A adoção tem entrevista simples e termo de responsabilidade — tudo para o bem do
            animal.
          </p>
        </div>
        <Link
          href="/sobre"
          className="rounded-full border-2 border-border px-5.5 py-2 text-lg text-foreground no-underline hover:bg-secondary hover:text-white"
        >
          como funciona a adoção
        </Link>
      </div>
    </div>
  );
}
