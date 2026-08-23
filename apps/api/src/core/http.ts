import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { withCors } from "@/middleware/cors";
import { AppError } from "./errors";

/**
 * Ponto único de formato de resposta HTTP da API. Todo controller deve
 * responder via ok/created/fail em vez de montar NextResponse na mão, para
 * o formato ficar igual entre todas as features.
 */
export function ok<T>(data: T) {
  return withCors(NextResponse.json({ data }));
}

export function created<T>(data: T) {
  return withCors(NextResponse.json({ data }, { status: 201 }));
}

export function fail(error: unknown) {
  if (error instanceof AppError) {
    return withCors(NextResponse.json({ error: error.message }, { status: error.statusCode }));
  }
  if (error instanceof ZodError) {
    return withCors(NextResponse.json({ error: "Dados inválidos", issues: error.issues }, { status: 400 }));
  }
  console.error(error);
  return withCors(NextResponse.json({ error: "Erro interno" }, { status: 500 }));
}
