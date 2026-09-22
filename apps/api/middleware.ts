import { NextRequest, NextResponse } from "next/server";

/**
 * CORS multi-origin: `src/middleware/cors.ts` só sabe aplicar 1 origin
 * estática (é chamado direto pelos testes unitários, fora de uma request
 * real, então não tem como resolver a origin do pedido). Este middleware
 * roda antes de toda rota /api e sobrescreve Access-Control-Allow-Origin
 * com a origin real do pedido, se ela estiver na allowlist.
 */
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? process.env.ALLOWED_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export function middleware(request: NextRequest) {
  const requestOrigin = request.headers.get("origin");
  const isAllowedOrigin = !!requestOrigin && allowedOrigins.includes(requestOrigin);

  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    if (isAllowedOrigin) response.headers.set("Access-Control-Allow-Origin", requestOrigin);
    response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return response;
  }

  const response = NextResponse.next();
  if (isAllowedOrigin) response.headers.set("Access-Control-Allow-Origin", requestOrigin);
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
