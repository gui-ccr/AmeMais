"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/hooks/use-session";

export default function NotFound() {
  const { session, loading } = useSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-8 text-center">
      <span className="text-6xl font-semibold text-primary">404</span>
      <h1 className="text-4xl font-semibold text-foreground">Página não encontrada</h1>
      <p className="max-w-xs text-base text-muted-foreground">
        {loading
          ? "Essa rota não existe no painel administrativo."
          : session
            ? "Essa rota não existe no painel administrativo. Verifique o endereço ou volte para o painel."
            : "Essa rota não existe e você não está logado. Verifique o endereço digitado ou entre com sua conta."}
      </p>
      {!loading && (
        <Link href={session ? "/admin" : "/login"} className="mt-1">
          <Button variant="outline" size="sm">
            {session ? "Voltar ao painel" : "Ir para o login"}
          </Button>
        </Link>
      )}
    </main>
  );
}
