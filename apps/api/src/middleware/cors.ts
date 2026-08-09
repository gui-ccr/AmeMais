import { NextResponse } from "next/server";

const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";

export function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
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
