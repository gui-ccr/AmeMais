import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para o servidor (Auth via cookies).
 * Use em Server Components, Route Handlers e Server Actions.
 * Lê a sessão a partir dos cookies da request — sem acesso ao browser.
 *
 * Nunca importe este módulo de um Client Component ("use client") — ele usa
 * `next/headers`, que só funciona em contexto de servidor. Para código
 * isomórfico (roda em ambos), importe este arquivo dinamicamente
 * (`await import("./supabase-server")`) só dentro do branch de servidor.
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
