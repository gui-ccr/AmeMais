import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { withCors } from "@/middleware/cors";
import { AppError } from "./errors";


export function ok<T>(data: T) {
  return withCors(NextResponse.json({ data }));
}

export function created<T>(data: T) {
  return withCors(NextResponse.json({ data }, { status: 201 }));
}


export function paginated<T>(data: T[], meta: { page: number; limit: number; total: number }) {
  return withCors(
    NextResponse.json(
      { data },
      {
        headers: {
          "X-Page": String(meta.page),
          "X-Limit": String(meta.limit),
          "X-Total-Count": String(meta.total),
        },
      },
    ),
  );
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
