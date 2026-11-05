"use client";

import type { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { authService } from "../services/auth-service";

/**
 * Perfil (com departamentos) do usuário logado. Só busca quando há sessão.
 *
 * Recebe a sessão de quem chama (useSession()) em vez de chamar sua própria
 * instância internamente: duas instâncias independentes de useSession() (ex:
 * uma no AdminGuard, outra aqui dentro) resolvem getSession() em promises
 * separadas, sem garantia de terminar no mesmo tick. Se a do AdminGuard
 * resolvesse primeiro, ele já se considerava "não carregando" enquanto essa
 * query aqui ainda estava com enabled:false (sessão interna ainda null) —
 * isLoading fica false com enabled:false, então profile ficava undefined
 * num loading=false e o guard redirecionava pro /login mesmo a sessão sendo
 * válida.
 */
export function useProfile(session: Session | null | undefined) {
  return useQuery({
    queryKey: ["profile", session?.user.id],
    queryFn: authService.getOwnProfile,
    enabled: !!session,
    staleTime: 5 * 60_000,
  });
}
