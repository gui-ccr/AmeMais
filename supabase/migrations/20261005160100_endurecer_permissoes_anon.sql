-- ==============================================================================
-- Endurece as permissões do papel anon (KAN-101)
-- ==============================================================================
-- Base: auditoria do banco real.
--   * RLS está ligado em todas as tabelas, mas o `anon` tinha os 7 privilégios
--     (inclusive TRUNCATE, que não passa pelo RLS) em todas elas, herdados do
--     padrão do Supabase.
--   * `departamentos` era legível pelo papel `public` (inclui o anon).
--   * `animais` deixava o anon ler a LINHA INTEIRA dos animais `disponivel`
--     (inclui adotante_id, lar_temporario_id e adotante_*).
--
-- Já foi aplicada no banco do projeto pelo SQL Editor (versão da proposta em
-- supabase/audit/03). IDEMPOTENTE.
-- ==============================================================================

-- 1. departamentos: leitura só para quem está logado.
--    O admin lê departamentos já autenticado (join em usuario_departamentos).
DROP POLICY IF EXISTS "Permitir leitura de departamentos" ON public.departamentos;
DROP POLICY IF EXISTS "Leitura de departamentos por logados" ON public.departamentos;

CREATE POLICY "Leitura de departamentos por logados"
    ON public.departamentos
    FOR SELECT
    TO authenticated
    USING (true);


-- 2. anon: tira tudo e devolve só a leitura que o produto precisa.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Eventos e urgências: as policies já restringem a linhas `is_active = true`.
GRANT SELECT ON public.events        TO anon;
GRANT SELECT ON public.urgency_items TO anon;

-- Animais: só as COLUNAS que o site público mostra (a policy já restringe a
-- `status_adocao = 'disponivel'`). Ficam de fora adotante_id, adotante_*,
-- lar_temporario_id e data_adocao. Quando o KAN-107 criar porte, idade e
-- descricao, acrescente-os aqui (em uma migration nova).
GRANT SELECT (id, nome, especie, raca, status_adocao, url_foto, created_at)
    ON public.animais TO anon;

-- pontos_coleta: o KAN-108 cria a policy de leitura pública e a coluna
-- `horario`; o GRANT SELECT para o anon entra junto com ele.


-- 3. authenticated: sem TRUNCATE, TRIGGER e REFERENCES.
--    (SELECT/INSERT/UPDATE/DELETE continuam; quem decide é o RLS.)
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM authenticated;


-- 4. Tabelas criadas daqui para frente não nascem abertas.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM authenticated;
