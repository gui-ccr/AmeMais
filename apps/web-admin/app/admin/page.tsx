"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { useSession } from "@/features/auth/hooks/use-session";
import { authService } from "@/features/auth/services/auth-service";
import { DashboardHome } from "@/features/dashboard/components/dashboard-home";

export default function AdminHomePage() {
  const { session } = useSession();
  const { data: profile } = useProfile(session);

  const primeiroNome = (profile?.nome || profile?.email || "").split(/[\s@]/)[0];

  return (
    <section className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 bg-background p-4 text-foreground sm:p-6 md:p-12">
      <div className="flex flex-col justify-between gap-4 border-b-2 border-secondary pb-6 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
            {primeiroNome ? `Olá, ${primeiroNome}` : "Painel Administrativo"}
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">
            Como a ONG está hoje.
            {profile?.departamentos.length ? ` Você está em ${profile.departamentos.join(", ")}.` : ""}
          </p>
        </div>
        <Button
          variant="outline"
          className="w-fit shrink-0 gap-2"
          onClick={() => authService.signOut().then(() => location.assign("/login"))}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sair
        </Button>
      </div>

      <DashboardHome />
    </section>
  );
}
