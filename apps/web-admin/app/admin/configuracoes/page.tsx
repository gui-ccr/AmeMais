"use client";

import { PerfilForm } from "@/features/configuracoes/components/perfil-form";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { useSession } from "@/features/auth/hooks/use-session";

export default function ConfiguracoesPage() {
  const { session } = useSession();
  const { data: profile } = useProfile(session);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <p className="mb-6 mt-2 text-muted-foreground">Suas informações pessoais e sua foto.</p>
      {profile && <PerfilForm key={profile.id} profile={profile} />}
    </div>
  );
}
