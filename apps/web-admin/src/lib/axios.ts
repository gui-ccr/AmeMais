import axios from "axios";
import { createSupabaseBrowserClient, createSupabaseServerClient } from "./supabase";

/**
 * Instância centralizada do Axios apontando para o apps/api.
 *
 * O interceptor de request injeta automaticamente o JWT do Supabase Auth
 * no header `Authorization: Bearer <token>` em toda chamada autenticada.
 *
 * Funciona de forma híbrida:
 * - **Server Components / Route Handlers**: usa `createSupabaseServerClient`
 *   que lê a sessão a partir dos cookies da request (Next.js `cookies()`).
 * - **Client Components**: usa `createSupabaseBrowserClient` que lê a sessão
 *   a partir do storage local gerenciado pelo SDK do Supabase no browser.
 *
 * Requisições de usuários não autenticados passam normalmente, sem o header.
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use(async (config) => {
  let token: string | undefined;

  try {
    if (typeof window === "undefined") {
      // --- Ambiente de servidor (Server Component, Route Handler, etc.) ---
      // cookies() do Next.js só pode ser chamado em contexto de server;
      // createSupabaseServerClient() é async por isso.
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    } else {
      // --- Ambiente de browser (Client Component) ---
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    }
  } catch {
    // Se a leitura da sessão falhar por qualquer motivo (e.g. cookies()
    // chamado fora de um request context), a requisição segue sem o header.
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
