-- ==============================================================================
-- 1. CRIAÇÃO DAS TABELAS (Eventos e Itens de Urgência)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    data_evento TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT false, -- Define se aparece ou não para o público
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.urgency_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    meta_arrecadacao NUMERIC(10, 2),
    valor_arrecadado NUMERIC(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT false, -- Define se aparece ou não para o público
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 2. CADASTRO DOS NOVOS MÓDULOS DE ACESSO (Seed Seguro)
-- ==============================================================================

-- Cadastrando as novas "portas" no sistema para o RLS poder validar
WITH novos_modulos (nome, slug) AS (
    VALUES 
    ('Gestão de Campanhas e Eventos', 'campanhas'),
    ('Gestão de Urgências', 'urgencias')
)
INSERT INTO public.modulos (nome, slug)
SELECT n.nome, n.slug
FROM novos_modulos n
WHERE NOT EXISTS (SELECT 1 FROM public.modulos m WHERE m.slug = n.slug);

-- ==============================================================================
-- 3. BLINDAGEM E POLÍTICAS RLS (WHITELIST)
-- ==============================================================================

-- Força a ativação da segurança nas tabelas
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.urgency_items ENABLE ROW LEVEL SECURITY;

-- Limpa políticas antigas caso a migration seja rodada mais de uma vez (Idempotência)
DROP POLICY IF EXISTS "Leitura publica de eventos ativos" ON public.events;
DROP POLICY IF EXISTS "Acesso total autenticado eventos" ON public.events;
DROP POLICY IF EXISTS "Leitura publica de urgencias ativas" ON public.urgency_items;
DROP POLICY IF EXISTS "Acesso total autenticado urgencias" ON public.urgency_items;


-- ------------------------------------------------------------------------------
-- POLÍTICAS DA TABELA: events
-- ------------------------------------------------------------------------------

-- A) Público (anon) só pode LER eventos que estejam com is_active = true
CREATE POLICY "Leitura publica de eventos ativos"
    ON public.events
    FOR SELECT
    TO anon
    USING (is_active = true);

-- B) Usuários Autenticados (Auth) somam a permissão do Cargo/Departamento
CREATE POLICY "Acesso total autenticado eventos"
    ON public.events
    FOR ALL
    TO authenticated
    USING (public.check_user_access('campanhas'))
    WITH CHECK (public.check_user_access('campanhas'));


-- ------------------------------------------------------------------------------
-- POLÍTICAS DA TABELA: urgency_items
-- ------------------------------------------------------------------------------

-- A) Público (anon) só pode LER urgências que estejam com is_active = true
CREATE POLICY "Leitura publica de urgencias ativas"
    ON public.urgency_items
    FOR SELECT
    TO anon
    USING (is_active = true);

-- B) Usuários Autenticados (Auth) somam a permissão do Cargo/Departamento
CREATE POLICY "Acesso total autenticado urgencias"
    ON public.urgency_items
    FOR ALL
    TO authenticated
    USING (public.check_user_access('urgencias'))
    WITH CHECK (public.check_user_access('urgencias'));