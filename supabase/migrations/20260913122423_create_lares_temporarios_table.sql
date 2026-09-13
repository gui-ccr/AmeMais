-- ==============================================================================
-- 1. Criação da tabela lares_temporarios
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.lares_temporarios (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_responsavel text NOT NULL,
    contato text NOT NULL,
    capacidade integer NOT NULL,
    status text NOT NULL CHECK (status IN ('disponível', 'ocupado', 'em avaliação', 'inativo')),
    endereco_regiao text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 2. Habilitar RLS (Segurança)
-- ==============================================================================
ALTER TABLE public.lares_temporarios ENABLE ROW LEVEL SECURITY;

-- Criar apenas a política para usuários autenticados via RBAC
-- (NÃO criamos leitura pública para proteger dados pessoais/LGPD)
CREATE POLICY "Acesso total autenticado lares" ON public.lares_temporarios
    FOR ALL TO authenticated
    USING (public.check_user_access('lares'))
    WITH CHECK (public.check_user_access('lares'));

-- ==============================================================================
-- 3. Cadastrar módulo no RBAC (Idempotente)
-- ==============================================================================
INSERT INTO public.modulos (nome, slug)
VALUES ('lares', 'lares')
ON CONFLICT (slug) DO NOTHING;