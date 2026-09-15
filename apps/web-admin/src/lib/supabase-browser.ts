import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para o browser (Auth). Usa a anon key pública.
 * Use em Client Components.
 * Acesso a dados sensíveis fica só no apps/api, via supabaseAdmin.
 *
 * Fica em um módulo separado de `supabase-server.ts` de propósito: este
 * arquivo não pode importar nada de `next/headers` (server-only), senão
 * qualquer Client Component que o importe quebra o build (o bundler tenta
 * empacotar `next/headers` para o client).
 *
 * Singleton: cada chamada a createBrowserClient() cria uma instância própria
 * de GoTrueClient. Múltiplas instâncias competindo pelo mesmo storage de
 * sessão fazem uma instância recém-criada emitir um SIGNED_OUT espúrio que
 * sobrescreve a sessão que outra instância acabou de gravar (o login
 * "funciona" e os dados retornam 200, mas o app é jogado de volta pro
 * /login pouco depois). Ver: github.com/supabase/auth-js/issues/873 e o
 * aviso "Multiple GoTrueClient instances detected".
 */
let browserClient: SupabaseClient | undefined;

export function createSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }

  return browserClient;
}
