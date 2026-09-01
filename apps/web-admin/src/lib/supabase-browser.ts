import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para o browser (Auth). Usa a anon key pública.
 * Use em Client Components.
 * Acesso a dados sensíveis fica só no apps/api, via supabaseAdmin.
 *
 * Fica em um módulo separado de `supabase-server.ts` de propósito: este
 * arquivo não pode importar nada de `next/headers` (server-only), senão
 * qualquer Client Component que o importe quebra o build (o bundler tenta
 * empacotar `next/headers` para o client).
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
