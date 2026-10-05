-- ==============================================================================
-- Animais: duas constraints de integridade do adotante que não chegaram ao banco
-- (KAN-101)
-- ==============================================================================
-- A auditoria (supabase/audit/04_conferir_drift.sql) mostrou que o banco real
-- não tem animais_adotante_completo_check nem
-- animais_dados_adocao_somente_adotado_check, ambas definidas na migration
-- 20260925211000 (seção 2). As demais constraints de animais já existem.
--
-- NOT VALID: não reprova linhas antigas; só vale para inserts e updates daqui
-- para frente. Depois de conferir que não há linha fora da regra, rode
--   ALTER TABLE public.animais VALIDATE CONSTRAINT animais_adotante_completo_check;
--   ALTER TABLE public.animais VALIDATE CONSTRAINT animais_dados_adocao_somente_adotado_check;
--
-- IDEMPOTENTE.
-- ==============================================================================

-- Os 4 campos do adotante andam juntos: ou vêm todos, ou nenhum.
ALTER TABLE public.animais DROP CONSTRAINT IF EXISTS animais_adotante_completo_check;
ALTER TABLE public.animais
    ADD CONSTRAINT animais_adotante_completo_check
    CHECK (num_nonnulls(adotante_nome, adotante_idade, adotante_cep, adotante_localidade) IN (0, 4))
    NOT VALID;

-- PRIVACIDADE: nome, idade e CEP de quem adotou (e a data da adoção) só podem
-- existir enquanto o animal está `adotado`. A policy pública deixa o site ler
-- animais `disponivel`; um animal devolvido que mantivesse esses dados os
-- deixaria legíveis por qualquer visitante. A API zera os campos ao mudar o
-- status, e este CHECK garante isso no banco mesmo para quem escrever direto.
ALTER TABLE public.animais DROP CONSTRAINT IF EXISTS animais_dados_adocao_somente_adotado_check;
ALTER TABLE public.animais
    ADD CONSTRAINT animais_dados_adocao_somente_adotado_check
    CHECK (
        status_adocao = 'adotado'
        OR (
            num_nonnulls(adotante_nome, adotante_idade, adotante_cep, adotante_localidade) = 0
            AND data_adocao IS NULL
        )
    ) NOT VALID;
