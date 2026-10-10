-- ==============================================================================
-- Animais: status padronizado (KAN-66)
-- ==============================================================================
-- Esta migration já foi aplicada no banco do projeto (consta no histórico do
-- Supabase) a partir do PR #60, que foi fechado sem merge. Este arquivo traz
-- a versão para o repositório, para o histórico local bater com o do banco.
--
-- Está IDEMPOTENTE de propósito: num banco novo ela roda depois de
-- 20260925211000, que já faz tudo isto, e não pode falhar. O efeito é o mesmo
-- da versão original do PR #60.
-- ==============================================================================

-- 1. Converte os valores legados para o padrão da API
UPDATE public.animais SET status_adocao = 'disponivel'        WHERE status_adocao = 'Disponível';
UPDATE public.animais SET status_adocao = 'adotado'           WHERE status_adocao = 'Adotado';
UPDATE public.animais SET status_adocao = 'em_tratamento'     WHERE status_adocao = 'Em Tratamento';
UPDATE public.animais SET status_adocao = 'em_lar_temporario' WHERE status_adocao = 'Temporário';

-- 2. Troca o valor padrão (DEFAULT) da coluna
ALTER TABLE public.animais ALTER COLUMN status_adocao SET DEFAULT 'disponivel';

-- 3. Trava (CHECK) exigindo apenas as 4 opções exatas da API
ALTER TABLE public.animais DROP CONSTRAINT IF EXISTS animais_status_adocao_check;
ALTER TABLE public.animais
    ADD CONSTRAINT animais_status_adocao_check
    CHECK (status_adocao IN ('disponivel', 'adotado', 'em_tratamento', 'em_lar_temporario'));

-- 4. Política de leitura pública para o front-end
DROP POLICY IF EXISTS "Leitura publica de animais disponiveis" ON public.animais;

CREATE POLICY "Leitura publica de animais disponiveis"
    ON public.animais
    FOR SELECT
    TO anon
    USING (status_adocao = 'disponivel');
