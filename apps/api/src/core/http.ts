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


export function paginated<T>(data: T[], meta: { limit: number; offset: number; total: number }) {
  return withCors(
    NextResponse.json(
      { data },
      {
        headers: {
          "X-Limit": String(meta.limit),
          "X-Offset": String(meta.offset),
          "X-Total-Count": String(meta.total),
        },
      },
    ),
  );
}

export function fail(error: unknown) {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {

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
