import { DatabaseError, ForbiddenError } from "./errors";

interface PostgrestLikeError {
  code?: string;
  message?: string;
}

/** Código do Postgres para "bloqueado pela política de RLS". */
const RLS_VIOLATION_CODE = "42501";

/**
 * Repositories não usam mais a service role — eles falam com o Supabase
 * como o próprio usuário (ver lib/supabase.ts, createSupabaseForUser), então
 * a RLS de cada tabela decide o que é permitido. Um INSERT/UPDATE barrado
 * pela política `WITH CHECK` volta como erro 42501 do Postgres: aqui a
 * gente traduz isso pra ForbiddenError (403) em vez do DatabaseError (500)
 * genérico.
 */
export function throwOnWriteError(error: PostgrestLikeError | null): void {
  if (!error) return;
  if (error.code === RLS_VIOLATION_CODE) {
    throw new ForbiddenError();
  }
  throw new DatabaseError(error);
}
