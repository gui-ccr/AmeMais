import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { UnauthorizedError } from "@/core/errors";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

export { UnauthorizedError };

/**
 * Valida o access_token do Supabase Auth enviado pelo frontend (ex.: apps/web-admin)
 * no header "Authorization: Bearer <token>".
 */
export async function requireUser(request: NextRequest): Promise<AuthenticatedUser> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  if (!token) {
    throw new UnauthorizedError("Token de autenticação ausente");
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    throw new UnauthorizedError("Token de autenticação inválido");
  }

  return { id: data.user.id, email: data.user.email ?? null };
}
