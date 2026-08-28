"use client";

import { Button } from "@/components/ui/button";
import { authService } from "@/features/auth/services/auth-service";
import { useProfile } from "@/features/auth/hooks/use-profile";

export default function AdminHomePage() {
  const { data: profile } = useProfile();

  return (
    <main className="flex min-h-screen flex-col gap-4 p-8">
      <h1 className="text-xl font-semibold">Painel Administrativo</h1>
      <p className="text-sm text-neutral-600">
        Logado como {profile?.nome || profile?.email} ({profile?.cargo}).
      </p>
      <Button variant="outline" className="w-fit" onClick={() => authService.signOut().then(() => location.assign("/login"))}>
        Sair
      </Button>
    </main>
  );
}
