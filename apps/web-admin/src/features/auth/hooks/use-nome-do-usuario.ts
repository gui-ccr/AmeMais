"use client";

import { useProfile } from "./use-profile";
import { useSession } from "./use-session";

/**
 * Nome do usuário logado (ou o e-mail, se o perfil não tiver nome) — o mesmo que a
 * sidebar mostra. `null` enquanto o perfil não carregou. Usado para registrar "quem fez"
 * uma ação (ex.: "Registrado por" nas doações).
 */
export function useNomeDoUsuario(): string | null {
  const { session } = useSession();
  const { data: profile } = useProfile(session);

  return profile?.nome || profile?.email || null;
}
