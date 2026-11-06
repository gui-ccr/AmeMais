"use client";

import { ShieldAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import { usePermissoes } from "../hooks/use-permissoes";
import type { Modulo } from "../services/permissoes-service";

/** Rota do painel -> módulo que ela exige. Rotas fora da lista (início, configurações) são livres. */
const MODULO_DA_ROTA: { prefixo: string; modulo: Modulo }[] = [
  { prefixo: "/admin/animais", modulo: "animais" },
  { prefixo: "/admin/lares", modulo: "lares" },
  { prefixo: "/admin/eventos", modulo: "eventos" },
  { prefixo: "/admin/urgencias", modulo: "urgencias" },
  { prefixo: "/admin/doacao", modulo: "doacoes" },
  { prefixo: "/admin/voluntarios", modulo: "voluntarios" },
  { prefixo: "/admin/equipe", modulo: "equipe" },
];

/**
 * Bloqueia o acesso direto por URL a telas de módulos sem permissão, com uma única mensagem
 * (sem "Tentar novamente": repetir não muda nada). Evita também mostrar "nenhum registro"
 * quando o vazio, na verdade, é falta de acesso.
 */
export function AcessoPorRota({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { carregando, podeVer } = usePermissoes();

  const modulo = MODULO_DA_ROTA.find(
    ({ prefixo }) => pathname === prefixo || pathname.startsWith(`${prefixo}/`),
  )?.modulo;

  if (!modulo) return <>{children}</>;

  if (carregando) {
    return <p className="p-6 text-sm text-neutral-500">Carregando...</p>;
  }

  if (!podeVer(modulo)) {
    return (
      <section role="alert" className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <p className="max-w-sm text-lg font-semibold text-foreground">
          Você não tem acesso a este módulo. Fale com a coordenação.
        </p>
      </section>
    );
  }

  return <>{children}</>;
}
