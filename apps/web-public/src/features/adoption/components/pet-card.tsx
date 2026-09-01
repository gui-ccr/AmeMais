import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { whatsappLink } from "@/lib/whatsapp";
import type { Pet } from "../types";

export function PetCard({ pet }: { pet: Pet }) {
  return (
    <div data-reveal-item className="flex flex-col overflow-hidden rounded-2xl border-2 border-border bg-white">
      <div className="relative h-50 w-full border-b-2 border-border">
        <Image src={pet.photo} alt={pet.name} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <b className="text-xl">{pet.name}</b>
          <Badge variant="outline" size="sm" className="border-primary bg-transparent text-primary">
            {pet.tag}
          </Badge>
        </div>
        <p className="flex-1 text-lg leading-snug text-muted-dark">{pet.description}</p>
        <a
          href={whatsappLink(`Oi! Tenho interesse em adotar o(a) ${pet.name} 🐾`)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-full bg-secondary py-2 text-center text-lg text-white no-underline hover:bg-primary hover:text-white"
        >
          quero conhecer <MessageCircle className="size-4.5" />
        </a>
      </div>
    </div>
  );
}
