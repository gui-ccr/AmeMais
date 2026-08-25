"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useProfile } from "../hooks/use-profile";
import { useSession } from "../hooks/use-session";

/**
 * Guarda de rota do Painel Admin: redireciona para /login se não houver
 * sessão. A checagem de cargo (Admin/Voluntário/Adotante) é feita pela API
 * (ver apps/api/src/middleware/rbac.ts, requireRole) — este guard só evita
 * o usuário deslogado de ver a UI do painel.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const loading = sessionLoading || (!!session && profileLoading);

  useEffect(() => {
    if (loading) return;
    if (!session || !profile) {
      router.replace("/login");
    }
  }, [loading, session, profile, router]);

  if (loading || !session || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-neutral-500">Carregando...</p>
      </main>
    );
  }

  return <>{children}</>;
}
