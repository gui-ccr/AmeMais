import { Home, Car, PartyPopper, Megaphone, type LucideIcon } from "lucide-react";

export const HELP_OPTIONS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Home,
    title: "Lar temporário",
    description: "Acolha um animal em casa até a adoção. Cobrimos ração e veterinário.",
  },
  { icon: Car, title: "Transporte", description: "Ajude a levar animais para resgates, consultas e feirinhas." },
  {
    icon: PartyPopper,
    title: "Eventos",
    description: "Mãos na massa nas feirinhas de adoção e bazares beneficentes.",
  },
  {
    icon: Megaphone,
    title: "Divulgação",
    description: "Fotografe, escreva e compartilhe os animais nas redes sociais.",
  },
];
