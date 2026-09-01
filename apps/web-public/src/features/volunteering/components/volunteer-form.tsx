"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";

const INTEREST_OPTIONS = [
  "Lar temporário",
  "Transporte de resgates",
  "Eventos e feirinhas",
  "Divulgação / redes sociais",
];

export function VolunteerForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [interest, setInterest] = useState(INTEREST_OPTIONS[0]);

  const message = [
    "Oi! Quero ser voluntário(a) da AmeMais 💚",
    name && `Nome: ${name}`,
    phone && `WhatsApp: ${phone}`,
    neighborhood && `Bairro: ${neighborhood}`,
    `Como quero ajudar: ${interest}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="max-w-155 rounded-2xl border-2 border-border bg-white p-6.5">
      <h2 className="font-display text-4xl font-bold">Quero ser voluntário</h2>
      <p className="mb-4 text-lg text-muted-dark">Preencha e a gente te chama no WhatsApp em até 2 dias.</p>
      <div className="flex flex-col gap-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Seu nome"
          className="rounded-lg border-2 border-border bg-brand-cream px-3.5 py-2.5 text-lg"
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Seu WhatsApp — (33) 9 ...."
          className="rounded-lg border-2 border-border bg-brand-cream px-3.5 py-2.5 text-lg"
        />
        <input
          value={neighborhood}
          onChange={(event) => setNeighborhood(event.target.value)}
          placeholder="Seu bairro"
          className="rounded-lg border-2 border-border bg-brand-cream px-3.5 py-2.5 text-lg"
        />
        <select
          value={interest}
          onChange={(event) => setInterest(event.target.value)}
          className="rounded-lg border-2 border-border bg-brand-cream px-3.5 py-2.5 text-lg text-foreground"
        >
          {INTEREST_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <a
          href={whatsappLink(message)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-center text-xl text-white no-underline hover:bg-primary-hover hover:text-white"
        >
          Enviar pelo WhatsApp <MessageCircle className="size-5" />
        </a>
      </div>
    </div>
  );
}
