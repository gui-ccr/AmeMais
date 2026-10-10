-- ==============================================================================
-- KAN-101 — Auditoria de segurança: RLS e permissões do anon
-- Passo 1: INSPEÇÃO (somente leitura). Rode no SQL Editor do Supabase.
-- Não altera nada. Cole o resultado de cada bloco na planilha da auditoria.
-- ==============================================================================


-- ------------------------------------------------------------------------------
-- A) Quais tabelas têm RLS ligado?  (rls_ligado = false  =>  tabela ABERTA
--    para qualquer papel que tenha GRANT, inclusive o anon)
-- ------------------------------------------------------------------------------
SELECT c.relname           AS tabela,
       c.relrowsecurity    AS rls_ligado,
       c.relforcerowsecurity AS rls_forcado
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relrowsecurity, c.relname;


-- ------------------------------------------------------------------------------
-- B) Que permissões (GRANT) o anon e o authenticated têm em cada tabela?
--    Esperado: o anon NÃO deveria ter INSERT/UPDATE/DELETE/TRUNCATE em nada.
-- ------------------------------------------------------------------------------
SELECT table_name  AS tabela,
       grantee,
       string_agg(privilege_type, ', ' ORDER BY privilege_type) AS permissoes
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
GROUP BY table_name, grantee
ORDER BY table_name, grantee;


-- ------------------------------------------------------------------------------
-- C) Policies existentes, por tabela e operação.
--    Atenção: uma policy só vale se o RLS estiver ligado na tabela (bloco A).
-- ------------------------------------------------------------------------------
SELECT tablename AS tabela,
       policyname,
       cmd       AS operacao,   -- SELECT / INSERT / UPDATE / DELETE / ALL
       roles,
       qual       AS using_expr,
       with_check AS with_check_expr
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;


-- ------------------------------------------------------------------------------
-- D) RESUMO DE RISCO: tabelas em que o anon tem GRANT e que estão sem RLS,
--    ou com RLS mas SEM nenhuma policy (nesse caso ninguém lê, mas confira se
--    é isso mesmo que se quer).
-- ------------------------------------------------------------------------------
SELECT c.relname AS tabela,
       c.relrowsecurity AS rls_ligado,
       (SELECT count(*) FROM pg_policies p
         WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS qtd_policies,
       (SELECT string_agg(g.privilege_type, ', ' ORDER BY g.privilege_type)
          FROM information_schema.role_table_grants g
         WHERE g.table_schema = 'public' AND g.table_name = c.relname
           AND g.grantee = 'anon') AS anon_permissoes,
       CASE
         WHEN NOT c.relrowsecurity THEN 'CRITICO: sem RLS'
         WHEN NOT EXISTS (SELECT 1 FROM pg_policies p
                           WHERE p.schemaname = 'public' AND p.tablename = c.relname)
              THEN 'RLS ligado sem policy (tudo negado)'
         ELSE 'ok (revisar as policies do bloco C)'
       END AS situacao
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY (NOT c.relrowsecurity) DESC, c.relname;


-- ------------------------------------------------------------------------------
-- E) Views no schema public: views rodam com as permissões do DONO por padrão
--    e podem furar o RLS. Importante para a view lares_com_ocupacao (LAR-BD-3).
--    security_invoker = on  =>  respeita o RLS de quem consulta (o desejado).
-- ------------------------------------------------------------------------------
SELECT c.relname AS view,
       coalesce(
         (SELECT option_value FROM pg_options_to_table(c.reloptions)
           WHERE option_name = 'security_invoker'), 'off') AS security_invoker
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'v'
ORDER BY c.relname;


-- ------------------------------------------------------------------------------
-- F) Buckets de storage e policies de storage.objects (fotos dos animais).
-- ------------------------------------------------------------------------------
SELECT id, name, public FROM storage.buckets ORDER BY name;

SELECT policyname, cmd AS operacao, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY cmd, policyname;
