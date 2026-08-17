import { NextRequest } from "next/server";
import type { UserRole } from "@amemais/shared-types";
import { supabaseAdmin } from "@/lib/supabase";
import { ForbiddenError } from "@/core/errors";
import { requireUser, type AuthenticatedUser } from "./auth";

export interface AuthenticatedProfile extends AuthenticatedUser {
  role: UserRole;
}

/**
 * Autentica o usuário (requireUser) e garante que o papel dele (tabela
 * "profiles") está entre os permitidos. Use em toda feature restrita ao
 * Painel Administrativo.
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[],
): Promise<AuthenticatedProfile> {
  const user = await requireUser(request);

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    throw new ForbiddenError("Perfil de usuário não encontrado");
  }

  const role = data.role as UserRole;

  if (!allowedRoles.includes(role)) {
    throw new ForbiddenError("Você não tem permissão para esta ação");
  }

  return { ...user, role };
}
