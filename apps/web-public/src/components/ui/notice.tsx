import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * Aviso no lugar de uma lista: vazia, sem resultado ou dados indisponíveis.
 * Sempre oferece o WhatsApp, que é o caminho real de contato com a ONG.
 */
export function Notice({
  emoji = "🐾",
  title,
  children,
  whatsappMessage = "Oi! Vim pelo site e queria falar com vocês 🐾",
}: {
  emoji?: string;
  title: string;
  children?: ReactNode;
  whatsappMessage?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-brand-sand px-6 py-10 text-center">
      <span aria-hidden className="text-5xl">
        {emoji}
      </span>
      <b className="font-display text-3xl leading-tight">{title}</b>
      {children ? <p className="max-w-xl text-lg text-muted-dark">{children}</p> : null}
      <a
        href={whatsappLink(whatsappMessage)}
        target="_blank"
        rel="noreferrer"
        className="mt-1 flex items-center justify-center gap-1.5 rounded-full bg-secondary px-6 py-2 text-lg text-white no-underline hover:bg-primary hover:text-white"
      >
        falar com a gente <MessageCircle className="size-4.5" />
      </a>
    </div>
  );
}
