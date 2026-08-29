import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para o browser (Auth). Usa a anon key pública.
 * Use em Client Components.
 * Acesso a dados sensíveis fica só no apps/api, via supabaseAdmin.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * Cliente Supabase para o servidor (Auth via cookies).
 * Use em Server Components, Route Handlers e Server Actions.
 * Lê a sessão a partir dos cookies da request — sem acesso ao browser.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // Server Components são read-only; set/remove são no-op propositais.
        setAll() {},
      },
    },
  );
}
