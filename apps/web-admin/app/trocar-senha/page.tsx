"use client";

import Link from "next/link";
import { TrocarSenhaForm } from "@/features/auth/components/trocar-senha-form";
import { useSession } from "@/features/auth/hooks/use-session";

/**
 * Acessada tanto pelo link de recuperação de senha (que cria uma sessão
 * temporária de recovery) quanto por um usuário já autenticado que queira
 * trocar a própria senha.
 */
export default function TrocarSenhaPage() {
  const { session, loading } = useSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-xl font-semibold">Painel AmeMais — trocar senha</h1>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : session ? (
        <TrocarSenhaForm />
      ) : (
        <div className="flex w-full max-w-sm flex-col gap-2 text-center">
          <p className="text-sm text-destructive font-medium">
            Este link é inválido ou já expirou.
          </p>
          <Link href="/recuperar-senha" className="text-sm font-medium text-foreground underline">
            Solicitar um novo link
          </Link>
        </div>
      )}
    </main>
  );
}
