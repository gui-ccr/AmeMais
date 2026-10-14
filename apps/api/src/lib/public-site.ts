import { after } from "next/server";

/** Tags de cache que a rota `POST /api/revalidate` do site aceita (ver apps/web-public/src/lib/cache-tags.ts). */
export type TagDoSite = "animais" | "urgencias" | "pontos-coleta";

const TIMEOUT_MS = 3000;

interface Opcoes {
  url?: string;
  secret?: string;
  fetchFn?: typeof fetch;
}

/**
 * Avisa o site público que algo mudou, para ele limpar o cache na hora em vez de
 * esperar o prazo de 30 s (ADR 0009, KAN-115). Nunca lança erro: se o site estiver
 * fora do ar ou demorar, só registra no log. Sem `WEB_PUBLIC_URL` ou
 * `REVALIDATE_SECRET` (local, testes) não faz nada.
 */
export async function notifyPublicSite(tags: TagDoSite[], opcoes: Opcoes = {}): Promise<void> {
  const url = opcoes.url ?? process.env.WEB_PUBLIC_URL;
  const secret = opcoes.secret ?? process.env.REVALIDATE_SECRET;
  if (!url || !secret) return;

  const fetchFn = opcoes.fetchFn ?? fetch;
  try {
    const resposta = await fetchFn(`${url.replace(/\/+$/, "")}/api/revalidate`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-revalidate-secret": secret },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!resposta.ok) {
      console.error(`Aviso ao site público recusado (${resposta.status}) para as tags ${tags.join(", ")}`);
    }
  } catch (erro) {
    console.error(`Falha ao avisar o site público (tags ${tags.join(", ")})`, erro);
  }
}

/**
 * Agenda o aviso para depois que a resposta for enviada (`after` do Next): quem
 * salvou no painel não espera o site nem é afetado se ele falhar. Fora de uma
 * requisição (ex.: testes chamando o controller direto) dispara sem esperar.
 */
export function avisarSiteDepois(...tags: TagDoSite[]): void {
  try {
    after(() => notifyPublicSite(tags));
  } catch {
    void notifyPublicSite(tags);
  }
}
