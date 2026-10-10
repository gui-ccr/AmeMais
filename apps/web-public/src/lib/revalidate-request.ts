import { createHash, timingSafeEqual } from "node:crypto";
import { ALL_CACHE_TAGS, type CacheTag } from "./cache-tags";

/** Cabeçalho em que a API manda o segredo compartilhado. */
export const REVALIDATE_SECRET_HEADER = "x-revalidate-secret";

interface Deps {
  /** Valor de `REVALIDATE_SECRET`; vazio/indefinido = recurso desligado. */
  secret: string | undefined;
  revalidateTag: (tag: string) => void;
}

function json(body: unknown, status: number) {
  return Response.json(body, { status });
}

/** Compara em tempo constante (e sem estourar com tamanhos diferentes). */
function secretsMatch(sent: string, expected: string): boolean {
  const a = createHash("sha256").update(sent).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Lógica do `POST /api/revalidate`, separada da rota para poder ser testada.
 *
 * Corpo: `{ "tags": ["animais", "urgencias"] }`. Só aceita as tags de
 * `CACHE_TAGS`; qualquer outra recusa a requisição inteira, para ninguém usar
 * esta rota para limpar o cache de outras coisas.
 */
export async function handleRevalidateRequest(request: Request, { secret, revalidateTag }: Deps): Promise<Response> {
  if (!secret) {
    return json({ error: "Revalidação não configurada" }, 503);
  }

  const sent = request.headers.get(REVALIDATE_SECRET_HEADER) ?? "";
  if (!secretsMatch(sent, secret)) {
    return json({ error: "Não autorizado" }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Corpo deve ser JSON" }, 400);
  }

  const tags = (body as { tags?: unknown } | null)?.tags;
  const valid =
    Array.isArray(tags) &&
    tags.length > 0 &&
    tags.every((tag): tag is CacheTag => typeof tag === "string" && (ALL_CACHE_TAGS as readonly string[]).includes(tag));
  if (!valid) {
    return json({ error: `tags deve ser uma lista com valores de: ${ALL_CACHE_TAGS.join(", ")}` }, 400);
  }

  const unique = [...new Set(tags)];
  for (const tag of unique) revalidateTag(tag);
  return json({ revalidated: unique }, 200);
}
