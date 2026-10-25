/**
 * Prepara um termo de busca do usuário para entrar num padrão `ilike` dentro de
 * `.or(...)` do PostgREST:
 *  - remove `,`, `(` e `)`, que no `.or()` separam/agrupam filtros (um termo com
 *    vírgula quebraria a sintaxe ou injetaria outro filtro);
 *  - escapa `\`, `%` e `_`, curingas do LIKE, para que sejam procurados literalmente.
 */
export function escaparTermoIlike(termo: string): string {
  return termo.replace(/[,()]/g, "").replace(/[\\%_]/g, "\\$&");
}
