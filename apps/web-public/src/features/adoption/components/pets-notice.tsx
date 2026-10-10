import type { ReactNode } from "react";
import { Notice } from "@/components/ui/notice";

/** Aviso no lugar do mural de adoção: lista vazia, filtro sem resultado ou dados indisponíveis. */
export function PetsNotice({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Notice title={title} whatsappMessage="Oi! Queria saber quais animais estão disponíveis para adoção 🐾">
      {children}
    </Notice>
  );
}
