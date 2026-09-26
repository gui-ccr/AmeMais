import { NextResponse } from "next/server";

/**
 * Fallback estático usado só quando a requisição não passa pelo
 * middleware.ts da raiz do app (ex.: chamando estas funções direto, como
 * fazem os testes unitários). Em runtime real, o middleware.ts já
 * sobrescreve Access-Control-Allow-Origin com a origin certa, resolvida
 * contra ALLOWED_ORIGINS — ver esse arquivo para a lógica de múltiplas
 * origins.
 */
const defaultOrigin = (process.env.ALLOWED_ORIGINS ?? process.env.ALLOWED_ORIGIN ?? "http://localhost:3000")
  .split(",")[0]
  ?.trim() ?? "http://localhost:3000";

export function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": defaultOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export function withCors(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(corsHeaders())) {
    response.headers.set(key, value);
  }
  return response;
}

export function corsPreflightResponse(): NextResponse {
  return withCors(new NextResponse(null, { status: 204 }));
}
