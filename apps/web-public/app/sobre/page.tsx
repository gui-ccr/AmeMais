import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/ui/page-header";
import { RescueSteps } from "@/features/about/components/rescue-steps";
import { AdoptionProcess } from "@/features/about/components/adoption-process";

export const metadata: Metadata = { title: "Sobre — AmeMais" };

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-11 pb-15">
      <PageHeader eyebrow="Quem somos" title="Uma rede de vizinhos que decidiu agir." />

      <div className="mt-4.5 grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-10">
        <div>
          <p className="mb-3 text-xl leading-snug">
            A AmeMais nasceu em 2019, no bairro Ipiranga, quando um grupo de moradores resgatou uma ninhada de
            filhotes abandonada perto do córrego. Hoje somos <b>22 voluntários fixos</b> e uma rede de{" "}
            <b>14 lares temporários</b> espalhados pela cidade.
          </p>
          <p className="mb-3 text-xl leading-snug">
            Atendemos os bairros <b>Centro, Ipiranga, São Cristóvão, Grão Pará, Matinha e Marajoara</b> — e, quando
            conseguimos transporte, casos graves em toda Teófilo Otoni.
          </p>
          <p className="text-xl leading-snug">
            Não recebemos verba pública. Tudo vem de doações da comunidade, bazares e feirinhas de adoção.
          </p>
        </div>
        <div className="relative h-90 w-full overflow-hidden rounded-2xl border-2 border-border">
          <Image
            src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=900&q=70"
            alt="Voluntária cuidando de cão resgatado"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      <h2 className="mt-11 mb-4 font-display text-4xl font-bold">Como funciona um resgate</h2>
      <RescueSteps />

      <h2 className="mt-11 mb-4 font-display text-4xl font-bold">Como funciona a adoção</h2>
      <AdoptionProcess />
    </div>
  );
}
