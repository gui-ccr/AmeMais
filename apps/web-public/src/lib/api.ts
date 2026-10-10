import type { CacheTag } from "./cache-tags";

/**
 * Cliente das rotas públicas da apps/api. Pensado para rodar SÓ no servidor
 * (Server Components): o browser nunca chama a API por aqui, então não há CORS,
 * a URL da API não vai para o bundle e o cache do Next (ISR) faz o trabalho.
 *
 * Ver ADR 0009.
 */

/**
 * Prazo de segurança, em segundos, que o Next reaproveita uma resposta antes de
 * buscar de novo. O caminho normal é a revalidação sob demanda (a API chama
 * `POST /api/revalidate` quando algo muda); este prazo cobre o caso de esse
 * aviso falhar. Ver ADR 0009.
 */
export const DEFAULT_REVALIDATE_SECONDS = 30;

/** Quanto esperar pela API antes de desistir (o site não pode travar por causa dela). */
const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Por que a busca falhou. Quem chama decide o que mostrar (ver KAN-113):
 * - config:  `API_URL` não definida (ex.: build no CI)
 * - network: API fora do ar, sem rede ou estourou o tempo
 * - http:    API respondeu com status de erro
 * - invalid: resposta que não bate com o contrato de `@amemais/shared-types`
 */
export type ApiErrorKind = "config" | "network" | "http" | "invalid";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: ApiErrorKind,
    readonly status?: number,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "ApiError";
  }
}

/** O mínimo que precisamos de um schema Zod, sem o site depender do Zod direto. */
interface Parser<T> {
  safeParse(input: unknown): { success: true; data: T } | { success: false; error: unknown };
}

interface ApiGetOptions {
  /** Segundos de cache (ISR). Padrão: `DEFAULT_REVALIDATE_SECONDS`. */
  revalidate?: number;
  /** Tags de cache (ver `cache-tags.ts`), para limpar este cache sob demanda. */
  tags?: CacheTag[];
  timeoutMs?: number;
  /** Parâmetros de URL. Valores `undefined` são ignorados. */
  query?: Record<string, string | number | undefined>;
}

function getBaseUrl(): string {
  const url = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new ApiError("API_URL não está configurada", "config");
  }
  return url.replace(/\/+$/, "");
}

/**
 * GET numa rota pública da API. Valida a resposta com o schema do envelope
 * (`{ data: ... }`) e devolve só o `data`. Em qualquer falha lança `ApiError`.
 */
export async function apiGet<T>(
  path: string,
  envelope: Parser<{ data: T }>,
  options: ApiGetOptions = {},
): Promise<T> {
  const { revalidate = DEFAULT_REVALIDATE_SECONDS, timeoutMs = DEFAULT_TIMEOUT_MS, query, tags } = options;

  const url = new URL(`${getBaseUrl()}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate, tags },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (cause) {
    throw new ApiError(`Falha ao chamar a API em ${path}`, "network", undefined, { cause });
  }

  if (!response.ok) {
    throw new ApiError(`A API respondeu ${response.status} em ${path}`, "http", response.status);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new ApiError(`Resposta de ${path} não é JSON`, "invalid", response.status, { cause });
  }

  const parsed = envelope.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(`Resposta de ${path} fora do contrato`, "invalid", response.status, {
      cause: parsed.error,
    });
  }
  return parsed.data.data;
}
