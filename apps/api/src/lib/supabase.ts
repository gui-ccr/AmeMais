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

/**
 * Client anônimo: anon key SEM token de usuário. É o que um visitante do site
 * público teria. Usado só pelas rotas `/api/public/*`.
 *
 * Nunca trocar por `supabaseAdmin` nelas: com o client anônimo a RLS continua
 * sendo a barreira no banco, então um erro no código da rota não vira vazamento.
 */
export function createSupabaseAnon(): SupabaseClient {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Client autenticado como o próprio usuário (anon key + o access_token dele
 * no header Authorization), em vez da service role.
 *
 * Isso faz o Postgres enxergar `auth.uid()` igual enxergaria se o browser
 * tivesse chamado o Supabase direto — ou seja, a RLS das tabelas
 * (check_user_access) vira a única fonte de verdade sobre o que esse
 * usuário pode fazer, tanto pra leitura quanto pra escrita. Usar isso em
 * vez de `supabaseAdmin` sempre que o dado pertence a uma tabela com RLS
 * baseada em cargo/departamento (events, animais, medical_records,
 * urgency_items).
 */
export function createSupabaseForUser(accessToken: string): SupabaseClient {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
