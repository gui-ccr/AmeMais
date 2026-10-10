-- ==============================================================================
-- Animais: dados do adotante e travas de privacidade (KAN-67)
-- ==============================================================================
-- Esta migration já foi aplicada no banco do projeto (consta no histórico do
-- Supabase) a partir do PR #60, que foi fechado sem merge. Este arquivo traz
-- a versão para o repositório, para o histórico local bater com o do banco.
--
-- Está IDEMPOTENTE de propósito: num banco novo ela roda depois de
-- 20260925211000, que já cria estas colunas, e não pode falhar. O efeito é o
-- mesmo da versão original do PR #60.
-- ==============================================================================

-- 1. Colunas do adotante
ALTER TABLE public.animais
    ADD COLUMN IF NOT EXISTS adotante_nome       text,
    ADD COLUMN IF NOT EXISTS adotante_idade      smallint,
    ADD COLUMN IF NOT EXISTS adotante_cep        text,
    ADD COLUMN IF NOT EXISTS adotante_localidade text;

-- 2. Travas de validação (CHECK)
ALTER TABLE public.animais DROP CONSTRAINT IF EXISTS animais_adotante_idade_check;
ALTER TABLE public.animais
    ADD CONSTRAINT animais_adotante_idade_check
    CHECK (adotante_idade >= 1 AND adotante_idade <= 120);

ALTER TABLE public.animais DROP CONSTRAINT IF EXISTS animais_adotante_cep_check;
ALTER TABLE public.animais
    ADD CONSTRAINT animais_adotante_cep_check
    CHECK (adotante_cep ~ '^[0-9]{8}$');

-- Privacidade: os dados do adotante só podem existir se o animal estiver adotado.
ALTER TABLE public.animais DROP CONSTRAINT IF EXISTS animais_dados_adotante_status_check;
ALTER TABLE public.animais
    ADD CONSTRAINT animais_dados_adotante_status_check
    CHECK (
        status_adocao = 'adotado'
        OR (adotante_nome IS NULL AND adotante_idade IS NULL AND adotante_cep IS NULL AND adotante_localidade IS NULL)
    );
