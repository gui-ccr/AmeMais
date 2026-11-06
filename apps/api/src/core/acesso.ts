import type { SupabaseClient } from "@supabase/supabase-js";
import { DatabaseError, ForbiddenError } from "./errors";

/** Slugs dos módulos de RBAC (tabela `modulos`) usados pelas rotas de escrita. */
export const MODULOS_RBAC = {
  animais: "operacional",
  lares: "lares",
  voluntarios: "voluntarios",
  eventos: "campanhas",
  urgencias: "urgencias",
  doacoes: "doacoes",
} as const;

export type ModuloRbac = (typeof MODULOS_RBAC)[keyof typeof MODULOS_RBAC];

/**
 * Exige nível 'total' no módulo antes de qualquer escrita (POST/PUT/PATCH/DELETE).
 *
 * A RLS já barra a escrita no banco, mas um UPDATE/DELETE barrado por USING volta
 * como "0 linhas" e viraria 404. Conferir antes devolve 403 claro para quem só tem
 * 'leitura'. Usa a mesma função da RLS (`check_user_access`), então não há regra duplicada.
 */
export async function exigirNivelTotal(db: SupabaseClient, modulo: ModuloRbac): Promise<void> {
  const { data, error } = await db.rpc("check_user_access", { modulo_slug: modulo, nivel_minimo: "total" });

  if (error) throw new DatabaseError(error);
  if (data !== true) throw new ForbiddenError("Você tem acesso somente de leitura neste módulo");
}
