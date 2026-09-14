import axios from "axios";
import { createSupabaseBrowserClient } from "./supabase-browser";

/**
 * Instância centralizada do Axios apontando para o apps/api, para uso em
 * Client Components. O interceptor injeta automaticamente o JWT do Supabase
 * Auth (lido do storage local do browser) no header `Authorization: Bearer
 * <token>` em toda chamada autenticada; requisições sem sessão passam
 * normalmente, sem o header.
 *
 * Não importe `supabase-server.ts` (usa `next/headers`) aqui nem
 * dinamicamente: mesmo atrás de um `if (typeof window === "undefined")` ou
 * de um `import()`, o Next ainda inclui o módulo no grafo do bundle do
 * client (que importa este arquivo) e a build quebra. Se algum dia um
 * Server Component precisar chamar o apps/api, crie uma instância de Axios
 * separada para ele, em vez de misturar os dois casos aqui.
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use(async (config) => {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Se a leitura da sessão falhar por qualquer motivo, a requisição
    // segue sem o header de autenticação.
  }

  return config;
});
