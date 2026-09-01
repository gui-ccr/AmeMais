import Image from "next/image";
import Link from "next/link";
import { Heart, Instagram, Mail, MessageCircle } from "lucide-react";
import { CopyPixButton } from "@/features/donations/components/copy-pix-button";

export function Footer() {
  return (
    <footer className="border-t-2 border-border bg-secondary text-brand-cream-muted">
      <div className="mx-auto grid max-w-6xl gap-7 px-6 py-9 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-amemais.jpg"
              alt="Logo AmeMais"
              width={40}
              height={40}
              className="rounded-full border-2 border-secondary-foreground object-cover"
            />
            <span className="font-display text-2xl font-bold text-white">AmeMais</span>
          </div>
          <p className="mt-2 text-lg text-brand-cream-muted">
            ONG de proteção animal
            <br />
            Teófilo Otoni · MG · desde 2019
          </p>
        </div>

        <div className="flex flex-col gap-1.5 text-lg">
          <b className="text-lg text-white">Navegue</b>
          <Link href="/adote" className="text-brand-terracotta-subtle no-underline">
            Adote um amigo
          </Link>
          <Link href="/doe" className="text-brand-terracotta-subtle no-underline">
            Central de ajuda
          </Link>
          <Link href="/acoes" className="text-brand-terracotta-subtle no-underline">
            Mural de ações
          </Link>
          <Link href="/voluntario" className="text-brand-terracotta-subtle no-underline">
            Seja voluntário
          </Link>
        </div>

        <div className="flex flex-col gap-1.5 text-lg">
          <b className="text-lg text-white">Contato</b>
          <span className="flex items-center gap-1.5">
            <MessageCircle className="size-4.5 shrink-0" /> (33) 9 9999-0000
          </span>
          <span className="flex items-center gap-1.5">
            <Instagram className="size-4.5 shrink-0" /> @amemais.to
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="size-4.5 shrink-0" /> contato@amemais.org.br
          </span>
        </div>

        <div>
          <b className="text-lg text-white">Doe via PIX</b>
          <div className="mt-2 max-w-70">
            <CopyPixButton compact />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5 border-t border-brand-charcoal-light p-3 text-center text-base text-brand-cream-muted">
        feito com <Heart className="size-3.5 fill-current text-primary" /> pela comunidade de Teófilo Otoni
      </div>
    </footer>
  );
}
