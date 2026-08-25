"use client";

import { useQuery } from "@tanstack/react-query";
import { authService } from "../services/auth-service";
import { useSession } from "./use-session";

/**
 * Perfil (com cargo) do usuário logado. Só busca quando há sessão —
 * use junto com useSession() para saber se ainda está carregando.
 */
export function useProfile() {
  const { session } = useSession();

  return useQuery({
    queryKey: ["profile", session?.user.id],
    queryFn: authService.getOwnProfile,
    enabled: !!session,
  });
}
