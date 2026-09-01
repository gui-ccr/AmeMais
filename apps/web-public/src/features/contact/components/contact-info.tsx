import { Clock, Instagram, Mail, MessageCircle } from "lucide-react";
import { WHATSAPP_DISPLAY, whatsappLink } from "@/lib/whatsapp";

export function ContactInfo() {
  return (
    <div className="flex flex-col gap-3">
      <a
        href={whatsappLink("Oi! Encontrei um animal precisando de resgate. Segue a localização:")}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-2xl bg-secondary px-5.5 py-4.5 text-xl text-white no-underline hover:bg-primary hover:text-white"
      >
        <MessageCircle className="size-7 shrink-0" /> WhatsApp — {WHATSAPP_DISPLAY}
      </a>
      <div className="flex flex-col gap-1.5 rounded-2xl border-2 border-border bg-white px-5.5 py-4 text-lg">
        <span className="flex items-center gap-1.5">
          <Instagram className="size-4.5 shrink-0 text-primary" /> Instagram:{" "}
          <a href="https://instagram.com/amemais.to" target="_blank" rel="noreferrer">
            @amemais.to
          </a>
        </span>
        <span className="flex items-center gap-1.5">
          <Mail className="size-4.5 shrink-0 text-primary" /> E-mail:{" "}
          <a href="mailto:contato@amemais.org.br">contato@amemais.org.br</a>
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-4.5 shrink-0 text-primary" /> Respondemos das 8h às 20h, todos os dias
        </span>
      </div>
      <div className="rounded-2xl border-2 border-border bg-brand-sand px-5.5 py-4">
        <b className="text-xl">Onde entregamos os animais adotados?</b>
        <p className="mt-1 text-lg leading-snug text-muted-dark">
          A visita e a entrega acontecem no lar temporário onde o animal está, sempre com um voluntário presente.
          Não temos sede física aberta ao público.
        </p>
      </div>
    </div>
  );
}
