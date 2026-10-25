import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { withCors } from "@/middleware/cors";
import { AppError, ValidationError } from "./errors";

/** `request.json()` lança em corpo vazio/malformado — isso é erro do cliente (400), não 500. */
export async function lerCorpoJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("JSON inválido");
  }
}


export function ok<T>(data: T) {
  return withCors(NextResponse.json({ data }));
}

export function created<T>(data: T) {
  return withCors(NextResponse.json({ data }, { status: 201 }));
}

/**
 * Resposta de listagem paginada: corpo { data } e total/limit nos headers
 * X-Total-Count e X-Limit, mais X-Page (paginação por página) ou X-Offset
 * (paginação por deslocamento), conforme o que o chamador informar. Os headers
 * são expostos ao browser via Access-Control-Expose-Headers em middleware/cors.ts.
 */
export function paginated<T>(
  data: T[],
  meta: { limit: number; total: number } & ({ page: number; offset?: never } | { offset: number; page?: never }),
) {
  const headers: Record<string, string> = {
    "X-Total-Count": String(meta.total),
    "X-Limit": String(meta.limit),
  };
  if (meta.page !== undefined) headers["X-Page"] = String(meta.page);
  if (meta.offset !== undefined) headers["X-Offset"] = String(meta.offset);
  return withCors(NextResponse.json({ data }, { headers }));
}

export function fail(error: unknown) {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      // 5xx é sempre inesperado: loga o erro real (inclusive `cause`) no
      // servidor. A resposta ao cliente usa só `error.message`, que essas
      // classes garantem ser sempre o texto seguro e fixo.
      console.error(error.message, error.cause ?? error);
    }
    return withCors(NextResponse.json({ error: error.message }, { status: error.statusCode }));
  }
  if (error instanceof ZodError) {
    return withCors(NextResponse.json({ error: "Dados inválidos", issues: error.issues }, { status: 400 }));
  }
  console.error(error);
  return withCors(NextResponse.json({ error: "Erro interno" }, { status: 500 }));
}
