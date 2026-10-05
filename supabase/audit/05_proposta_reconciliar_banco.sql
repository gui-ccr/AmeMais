-- >>> JÁ VIROU MIGRATION: supabase/migrations/20261005160000_reconciliar_banco_real.sql
-- >>> Esta proposta foi aplicada no banco e fica aqui só como registro. Não rode de novo.
-- ==============================================================================
-- KAN-101 — PROPOSTA: faz o banco real bater com o que o código e as migrations
-- esperam. NÃO É UMA MIGRATION (mesmo esquema da proposta 03).
-- ==============================================================================
-- Base: resultado de 04_conferir_drift.sql no banco real, que apontou como
-- FALTANDO:
--   * lares_temporarios: colunas nome_responsavel, contato, endereco_regiao,
--     is_active e created_at, e a policy "Acesso total autenticado lares"
--     (a tabela é a versão antiga do schema legado; o CREATE TABLE IF NOT EXISTS
--     da migration 20260913122423 não fez nada)
--   * urgency_items: colunas prioridade, tipo, unidade e data_limite
--     (migration 20260925210000)
--   * Storage: bucket animal-photos e a policy "Upload de fotos de animais"
--     (migration 20260925211000)
--
-- Efeito hoje: a API de Lares (SELECT nome_responsavel, contato, ...), a de
-- Urgências (SELECT unidade, prioridade, tipo, data_limite) e o upload de foto
-- falham contra este banco.
--
-- Idempotente e numa transação só: se algo falhar (ex.: um status de lar fora
-- do esperado), NADA é alterado. Rode primeiro num projeto de TESTE.
-- Depois de rodar: 04_conferir_drift.sql deve voltar tudo ok = true.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- A. lares_temporarios
-- ------------------------------------------------------------------------------

ALTER TABLE public.lares_temporarios
    ADD COLUMN IF NOT EXISTS nome_responsavel text,
    ADD COLUMN IF NOT EXISTS contato          text,
    ADD COLUMN IF NOT EXISTS endereco_regiao  text,
    ADD COLUMN IF NOT EXISTS is_active        boolean     DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_at       timestamptz DEFAULT now();

-- Linhas antigas (se houver) não têm esses dados: valor neutro, para dar para
-- marcar as colunas como NOT NULL sem inventar informação de verdade.
UPDATE public.lares_temporarios SET nome_responsavel = 'Não informado' WHERE nome_responsavel IS NULL;
UPDATE public.lares_temporarios SET contato          = 'Não informado' WHERE contato          IS NULL;
UPDATE public.lares_temporarios SET endereco_regiao  = 'Não informado' WHERE endereco_regiao  IS NULL;
UPDATE public.lares_temporarios SET is_active        = true            WHERE is_active        IS NULL;
UPDATE public.lares_temporarios SET created_at       = now()           WHERE created_at       IS NULL;

ALTER TABLE public.lares_temporarios
    ALTER COLUMN nome_responsavel SET NOT NULL,
    ALTER COLUMN contato          SET NOT NULL,
    ALTER COLUMN endereco_regiao  SET NOT NULL,
    ALTER COLUMN created_at       SET NOT NULL;

-- Status: o código usa disponivel | ocupado | em_avaliacao | inativo (sem
-- acento, com underscore). Converte o que existir e recria a regra.
UPDATE public.lares_temporarios
SET status = CASE
    WHEN status IS NULL                                          THEN 'disponivel'
    WHEN status IN ('disponível', 'Disponível', 'Disponivel')    THEN 'disponivel'
    WHEN status IN ('Ocupado')                                   THEN 'ocupado'
    WHEN status IN ('em avaliação', 'Em avaliação', 'Em Avaliação') THEN 'em_avaliacao'
    WHEN status IN ('Inativo')                                   THEN 'inativo'
    ELSE status
END;

-- Remove QUALQUER regra antiga sobre o status (o nome muda conforme quem criou).
DO $$
DECLARE
    c record;
BEGIN
    FOR c IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.lares_temporarios'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%status%'
    LOOP
        EXECUTE format('ALTER TABLE public.lares_temporarios DROP CONSTRAINT %I', c.conname);
    END LOOP;
END $$;

ALTER TABLE public.lares_temporarios
    ALTER COLUMN status SET DEFAULT 'disponivel',
    ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.lares_temporarios
    ADD CONSTRAINT lares_temporarios_status_check
    CHECK (status IN ('disponivel', 'ocupado', 'em_avaliacao', 'inativo'));

-- capacidade > 0 só para linhas novas ou editadas (NOT VALID não revalida as
-- antigas; rode VALIDATE CONSTRAINT quando não houver mais lar com 0).
ALTER TABLE public.lares_temporarios DROP CONSTRAINT IF EXISTS lares_temporarios_capacidade_check;
ALTER TABLE public.lares_temporarios
    ADD CONSTRAINT lares_temporarios_capacidade_check CHECK (capacidade > 0) NOT VALID;

-- RLS (já ligado no banco real) + a policy que faltava.
ALTER TABLE public.lares_temporarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total autenticado lares" ON public.lares_temporarios;
CREATE POLICY "Acesso total autenticado lares" ON public.lares_temporarios
    FOR ALL TO authenticated
    USING (public.check_user_access('lares'))
    WITH CHECK (public.check_user_access('lares'));


-- ------------------------------------------------------------------------------
-- B. urgency_items (cópia idempotente da migration 20260925210000)
-- ------------------------------------------------------------------------------

ALTER TABLE public.urgency_items
    ADD COLUMN IF NOT EXISTS prioridade  TEXT NOT NULL DEFAULT 'importante',
    ADD COLUMN IF NOT EXISTS tipo        TEXT NOT NULL DEFAULT 'outros',
    ADD COLUMN IF NOT EXISTS unidade     TEXT NOT NULL DEFAULT 'R$',
    ADD COLUMN IF NOT EXISTS data_limite DATE;

ALTER TABLE public.urgency_items DROP CONSTRAINT IF EXISTS urgency_items_prioridade_check;
ALTER TABLE public.urgency_items
    ADD CONSTRAINT urgency_items_prioridade_check
    CHECK (prioridade IN ('urgente', 'importante', 'continua'));

ALTER TABLE public.urgency_items DROP CONSTRAINT IF EXISTS urgency_items_tipo_check;
ALTER TABLE public.urgency_items
    ADD CONSTRAINT urgency_items_tipo_check
    CHECK (tipo IN ('racao', 'medicamento', 'consulta', 'cirurgia', 'higiene', 'cobertores', 'outros'));

ALTER TABLE public.urgency_items DROP CONSTRAINT IF EXISTS urgency_items_unidade_check;
ALTER TABLE public.urgency_items
    ADD CONSTRAINT urgency_items_unidade_check
    CHECK (unidade IN ('kg', 'un', 'L', 'R$'));


-- ------------------------------------------------------------------------------
-- C. Storage: bucket de fotos e policy de upload
--    (cópia da seção 4 da migration 20260925211000)
-- ------------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'animal-photos',
    'animal-photos',
    true,
    4194304,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public             = EXCLUDED.public,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Upload de fotos de animais" ON storage.objects;
CREATE POLICY "Upload de fotos de animais"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'animal-photos'
        AND public.check_user_access('operacional', 'total')
    );

COMMIT;


-- ==============================================================================
-- DEPOIS DE RODAR
--   1. 04_conferir_drift.sql: nenhuma linha com ok = false.
--   2. Admin: abrir Urgências (lista deve carregar) e Lares (lista deve carregar,
--      mesmo vazia). Cadastrar um animal com foto.
--   3. Se a API de Urgências já funcionava para você, é porque o ambiente que
--      você usa NÃO é este banco: avise, porque aí o descompasso é entre
--      ambientes.
--
-- OBSERVAÇÃO: o schema atual deixa o `anon` sem acesso a pontos_coleta e
-- voluntarios (proposta 03). As policies e colunas deles são dos KAN-108 e
-- KAN-75/74.
-- ==============================================================================
