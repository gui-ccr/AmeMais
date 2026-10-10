-- ==============================================================================
-- Reconcilia o banco com o que o código e as migrations anteriores esperam
-- (KAN-101, KAN-71, KAN-72)
-- ==============================================================================
-- A auditoria do banco real mostrou que migrations anteriores constavam como
-- aplicadas mas não surtiram efeito. Faltavam:
--   * lares_temporarios: colunas nome_responsavel, contato, endereco_regiao,
--     is_active, created_at e a policy "Acesso total autenticado lares" (a
--     tabela vem do schema legado; o CREATE TABLE IF NOT EXISTS da migration
--     20260913122423 não faz nada quando ela já existe)
--   * urgency_items: colunas da migration 20260925210000
--   * Storage: bucket animal-photos e a policy de upload (20260925211000)
--
-- Já foi aplicada no banco do projeto pelo SQL Editor (versão da proposta em
-- supabase/audit/05). Está IDEMPOTENTE: no banco que já a recebeu e em um banco
-- novo, ela não altera nada que já esteja certo.
-- ==============================================================================


-- ------------------------------------------------------------------------------
-- A. lares_temporarios
-- ------------------------------------------------------------------------------

-- `status` também entra aqui: o schema legado não tem essa coluna, então num
-- banco novo ela não existiria.
ALTER TABLE public.lares_temporarios
    ADD COLUMN IF NOT EXISTS nome_responsavel text,
    ADD COLUMN IF NOT EXISTS contato          text,
    ADD COLUMN IF NOT EXISTS endereco_regiao  text,
    ADD COLUMN IF NOT EXISTS status           text,
    ADD COLUMN IF NOT EXISTS is_active        boolean     DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_at       timestamptz DEFAULT now();

-- Remove QUALQUER regra antiga sobre o status (o nome muda conforme quem criou
-- e ela aceita os valores COM acento, que impediriam a conversão abaixo).
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

-- Linhas antigas (se houver) não têm esses dados: valor neutro, para poder
-- marcar as colunas como NOT NULL sem inventar informação de verdade.
UPDATE public.lares_temporarios SET nome_responsavel = 'Não informado' WHERE nome_responsavel IS NULL;
UPDATE public.lares_temporarios SET contato          = 'Não informado' WHERE contato          IS NULL;
UPDATE public.lares_temporarios SET endereco_regiao  = 'Não informado' WHERE endereco_regiao  IS NULL;
UPDATE public.lares_temporarios SET is_active        = true            WHERE is_active        IS NULL;
UPDATE public.lares_temporarios SET created_at       = now()           WHERE created_at       IS NULL;

-- Status: o código usa disponivel | ocupado | em_avaliacao | inativo (sem
-- acento, com underscore). Converte o que existir; um valor desconhecido faz a
-- migration inteira falhar no CHECK abaixo, em vez de ser "adivinhado".
UPDATE public.lares_temporarios
SET status = CASE
    WHEN status IS NULL                                             THEN 'disponivel'
    WHEN status IN ('disponível', 'Disponível', 'Disponivel')       THEN 'disponivel'
    WHEN status IN ('Ocupado')                                      THEN 'ocupado'
    WHEN status IN ('em avaliação', 'Em avaliação', 'Em Avaliação') THEN 'em_avaliacao'
    WHEN status IN ('Inativo')                                      THEN 'inativo'
    ELSE status
END;

ALTER TABLE public.lares_temporarios
    ALTER COLUMN nome_responsavel SET NOT NULL,
    ALTER COLUMN contato          SET NOT NULL,
    ALTER COLUMN endereco_regiao  SET NOT NULL,
    ALTER COLUMN created_at       SET NOT NULL,
    ALTER COLUMN status           SET DEFAULT 'disponivel',
    ALTER COLUMN status           SET NOT NULL;

ALTER TABLE public.lares_temporarios
    ADD CONSTRAINT lares_temporarios_status_check
    CHECK (status IN ('disponivel', 'ocupado', 'em_avaliacao', 'inativo'));

-- capacidade > 0 só para linhas novas ou editadas (NOT VALID não revalida as
-- antigas; rode VALIDATE CONSTRAINT quando não houver mais lar com capacidade 0).
ALTER TABLE public.lares_temporarios DROP CONSTRAINT IF EXISTS lares_temporarios_capacidade_check;
ALTER TABLE public.lares_temporarios
    ADD CONSTRAINT lares_temporarios_capacidade_check CHECK (capacidade > 0) NOT VALID;

ALTER TABLE public.lares_temporarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total autenticado lares" ON public.lares_temporarios;
CREATE POLICY "Acesso total autenticado lares" ON public.lares_temporarios
    FOR ALL TO authenticated
    USING (public.check_user_access('lares'))
    WITH CHECK (public.check_user_access('lares'));


-- ------------------------------------------------------------------------------
-- B. urgency_items (mesmo conteúdo da migration 20260925210000)
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
-- C. Storage: bucket de fotos e policy de upload (seção 4 da 20260925211000)
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
