-- >>> JÁ VIROU MIGRATION: supabase/migrations/20261005160100_endurecer_permissoes_anon.sql
-- >>> Esta proposta foi aplicada no banco e fica aqui só como registro. Não rode de novo.
-- ==============================================================================
-- KAN-101 — PROPOSTA de endurecimento de permissões. NÃO É UMA MIGRATION.
-- ==============================================================================
-- Fica em supabase/audit/ de propósito: não rode `supabase db push` com isto
-- dentro de migrations/ sem revisar. Passos sugeridos:
--   1. Rodar num projeto de TESTE (não no principal).
--   2. Rodar supabase/audit/02_testar_anon.mjs e o login/painel do admin.
--   3. Só então virar uma migration com timestamp em supabase/migrations/.
--
-- Base: resultado da auditoria no banco real (blocos C e D):
--   * As 21 tabelas têm RLS ligado -> nenhuma linha está aberta por falta de RLS.
--   * O papel `anon` tem os 7 privilégios (inclusive TRUNCATE, que não passa
--     pelo RLS) em TODAS as tabelas, herdados do padrão do Supabase.
--   * `departamentos` tem leitura para o papel `public` (inclui o anon).
--   * `animais` deixa o anon ler a LINHA INTEIRA dos animais `disponivel`
--     (inclui adotante_id, lar_temporario_id e adotante_*).
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. departamentos: leitura só para quem está logado
--    Hoje: "Permitir leitura de departamentos" TO public USING (true).
--    O admin lê departamentos já autenticado (join em usuario_departamentos),
--    então o login não depende do anon aqui.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Permitir leitura de departamentos" ON public.departamentos;

CREATE POLICY "Leitura de departamentos por logados"
    ON public.departamentos
    FOR SELECT
    TO authenticated
    USING (true);


-- ------------------------------------------------------------------------------
-- 2. anon: tira tudo e devolve só a leitura que o produto precisa
-- ------------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Eventos e urgências: a policy já restringe a linhas `is_active = true`.
GRANT SELECT ON public.events        TO anon;
GRANT SELECT ON public.urgency_items TO anon;

-- Animais: só as COLUNAS que o site público mostra (a policy já restringe a
-- `status_adocao = 'disponivel'`). Fora daqui ficam adotante_id, adotante_*,
-- lar_temporario_id e data_adocao. Quando o KAN-107 criar porte, idade e
-- descricao, acrescente-os nesta lista.
GRANT SELECT (id, nome, especie, raca, status_adocao, url_foto, created_at)
    ON public.animais TO anon;

-- pontos_coleta: o KAN-108 cria a policy de leitura pública e a coluna
-- `horario`; o GRANT SELECT para o anon entra junto com ele.


-- ------------------------------------------------------------------------------
-- 3. authenticated: sem TRUNCATE, TRIGGER e REFERENCES
--    (SELECT/INSERT/UPDATE/DELETE continuam; quem decide é o RLS.)
-- ------------------------------------------------------------------------------
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM authenticated;


-- ------------------------------------------------------------------------------
-- 4. Tabelas criadas daqui para frente não nascem abertas
--    (vale para objetos criados pelo papel que roda esta migration, que no
--    Supabase é o `postgres`.)
-- ------------------------------------------------------------------------------
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM authenticated;

COMMIT;


-- ==============================================================================
-- COMO CONFERIR DEPOIS (rodar 01_inspecionar_rls.sql de novo):
--   * Bloco B: o anon só deve aparecer com SELECT em events, urgency_items e
--     animais (colunas); nenhum outro privilégio.
--   * Bloco B: o authenticated não deve ter TRUNCATE, TRIGGER nem REFERENCES.
--   * 02_testar_anon.mjs: "anon lê?" = BLOQUEADO em tudo, menos nas tabelas
--     públicas por design.
--   * Admin: login e as telas de Animais, Eventos e Urgências continuam
--     funcionando.
--   * SELECT * FROM animais pelo anon deve falhar (permission denied for
--     column); a API pública usa lista fixa de colunas, então não é afetada.
--
-- ATENÇÃO: o trigger que cria o registro em `usuarios` ao cadastrar um usuário
-- (20260829184500_refatora_usuarios_trigger.sql) deve continuar funcionando;
-- teste um cadastro novo no projeto de teste antes de aplicar no principal.
-- ==============================================================================
