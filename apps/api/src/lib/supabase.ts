import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente com service role: só pode ser usado no backend (apps/api).
 * Nunca importar este arquivo em código que roda no browser.
 *
 * Criado sob demanda (não no module scope) para não quebrar o build/collect
 * de page data do Next.js em ambientes sem as env vars do Supabase definidas.
 */
let client: SupabaseClient | undefined;

function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return client;
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseAdmin(), prop, receiver);
  },
});
