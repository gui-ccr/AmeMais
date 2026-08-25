import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para o browser (Auth). Usa a anon key pública.
 * Acesso a dados sensíveis fica só no apps/api, via supabaseAdmin.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
