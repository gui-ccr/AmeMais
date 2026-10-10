import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { whatsappLink } from "@/lib/whatsapp";
import type { Pet } from "../types";

export function PetCard({ pet }: { pet: Pet }) {
  return (
    <div data-reveal-item className="flex flex-col items-center gap-2 text-center">
      <div className="relative">
        <div
          className="relative size-44 overflow-hidden border-[3px] border-dashed border-border bg-white p-1"
          style={{ borderRadius: "42% 58% 61% 39% / 44% 41% 59% 56%" }}
        >
          <div className="relative size-full overflow-hidden" style={{ borderRadius: "42% 58% 61% 39% / 44% 41% 59% 56%" }}>
            {pet.photo ? (
              <Image
                src={pet.photo}
                alt={pet.name}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover"
              />
            ) : (
              // Animal sem foto cadastrada: um <Image src=""> lançaria erro e derrubaria a página.
              <div
                role="img"
                aria-label={`${pet.name} ainda não tem foto`}
                className="flex size-full items-center justify-center bg-brand-sand text-6xl"
              >
                🐾
              </div>
            )}
          </div>
        </div>
        <Badge
          variant="outline"
          size="sm"
          className="absolute -right-2 -bottom-1 rotate-6 border-primary bg-brand-cream text-primary shadow-sm"
        >
          {pet.tag}
        </Badge>
      </div>
      <b className="mt-1 font-display text-3xl leading-none">{pet.name}</b>
      <p className="text-lg leading-snug text-muted-dark">{pet.description}</p>
      <a
        href={whatsappLink(`Oi! Tenho interesse em adotar o(a) ${pet.name} 🐾`)}
        target="_blank"
        rel="noreferrer"
        className="mt-1 flex items-center justify-center gap-1.5 rounded-full bg-secondary px-6 py-2 text-lg text-white no-underline hover:bg-primary hover:text-white"
      >
        quero conhecer <MessageCircle className="size-4.5" />
      </a>
    </div>
  );
}
