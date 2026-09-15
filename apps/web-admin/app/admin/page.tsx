"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authService } from "@/features/auth/services/auth-service";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { useSession } from "@/features/auth/hooks/use-session";

export default function AdminHomePage() {
  const { session } = useSession();
  const { data: profile } = useProfile(session);

  return (
    <main className="flex min-h-screen flex-col gap-4 p-8">
      <h1 className="text-xl font-semibold">Painel Administrativo</h1>
      <p className="text-sm text-neutral-600">
        Logado como {profile?.nome || profile?.email}
        {profile?.departamentos.length ? ` (${profile.departamentos.join(", ")})` : ""}.
      </p>
      <div className="flex gap-3">
        <Link href="/admin/eventos">
          <Button variant="default">Eventos e Urgências</Button>
        </Link>
        <Link href="/design-system">
          <Button variant="outline">Ver Design System (Componentes)</Button>
        </Link>
        <Button variant="outline" className="w-fit" onClick={() => authService.signOut().then(() => location.assign("/login"))}>
          Sair
        </Button>
      </div>
    </main>
  );
}
