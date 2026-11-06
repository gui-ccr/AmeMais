"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AcessoPorRota } from "@/features/auth/components/acesso-por-rota";
import { Sidebar } from "./sidebar";

/**
 * Estrutura do painel: sidebar fixa em telas >= lg; em telas menores ela vira um drawer aberto
 * por um botão de menu numa barra superior, e fecha ao navegar.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  // Fecha o drawer ao trocar de rota.
  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      {menuAberto && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          aria-hidden="true"
          onClick={() => setMenuAberto(false)}
        />
      )}
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-sidebar-border bg-sidebar-bg px-4 text-sidebar-fg lg:hidden">
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            className="rounded-md p-2 hover:bg-secondary-hover"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <Image src="/logo-amemais.jpg" alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
          <span className="font-display text-xl font-bold text-primary-light">AmeMais</span>
        </header>
        <main className="min-w-0 flex-1">
          <AcessoPorRota>{children}</AcessoPorRota>
        </main>
      </div>
    </div>
  );
}
