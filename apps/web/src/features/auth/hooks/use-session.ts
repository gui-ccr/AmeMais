"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

/**
 * Sessão do Supabase Auth reativa: atualiza sozinha em login/logout/refresh
 * de token, em qualquer componente que use este hook.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return { session, loading };
}
