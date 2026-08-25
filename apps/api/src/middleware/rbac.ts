import { NextRequest } from "next/server";
import type { UserRole } from "@amemais/shared-types";
import { supabaseAdmin } from "@/lib/supabase";
import { ForbiddenError } from "@/core/errors";
import { requireUser, type AuthenticatedUser } from "./auth";

export interface AuthenticatedProfile extends AuthenticatedUser {
  cargo: UserRole;
}

/**
 * Autentica o usuário (requireUser) e garante que o cargo dele (tabela
 * "usuarios") está entre os permitidos. Use em toda feature restrita a
 * papéis específicos (ex.: só Admin pode deletar usuário, mas Voluntário
 * já pode cadastrar animal).
 *
 * Consulta via supabaseAdmin (service role) para pular o RLS de
 * "usuarios" — aqui é o backend decidindo quem pode o quê, não o Postgres.
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[],
): Promise<AuthenticatedProfile> {
  const user = await requireUser(request);

  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .select("cargo")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    throw new ForbiddenError("Usuário não encontrado");
  }

  const cargo = data.cargo as UserRole;

  if (!allowedRoles.includes(cargo)) {
    throw new ForbiddenError("Você não tem permissão para esta ação");
  }

  return { ...user, cargo };
}
