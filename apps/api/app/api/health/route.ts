import { NextResponse } from "next/server";
import { withCors, corsPreflightResponse } from "@/middleware/cors";

export function GET() {
  return withCors(NextResponse.json({ status: "ok" }));
}

export const OPTIONS = corsPreflightResponse;
