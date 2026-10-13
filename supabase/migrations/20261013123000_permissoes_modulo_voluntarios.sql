-- 1. Inserir o módulo voluntarios com nome e slug (idempotente)
INSERT INTO public.modulos (nome, slug)
SELECT 'Voluntários', 'voluntarios'
WHERE NOT EXISTS (
    SELECT 1 FROM public.modulos WHERE slug = 'voluntarios'
);

-- 2. Dar permissão aos departamentos autorizados (Presidência, Vice-presidência, Secretaria)
DO $$
DECLARE
    v_modulo_id uuid;
BEGIN
    -- Busca o ID do módulo pelo slug recém-criado
    SELECT id INTO v_modulo_id FROM public.modulos WHERE slug = 'voluntarios';

    -- Associa o módulo aos departamentos informados concedendo nível 'total'
    INSERT INTO public.departamento_modulos (departamento_id, modulo_id, nivel_acesso)
    SELECT d.id, v_modulo_id, 'total'
    FROM public.departamentos d
    WHERE (
           d.nome ILIKE '%presidência%' 
        OR d.nome ILIKE '%presidencia%'
        OR d.nome ILIKE '%vice%'
        OR d.nome ILIKE '%secretaria%'
        OR d.nome ILIKE '%secretária%'
    )
    AND NOT EXISTS (
        SELECT 1 
        FROM public.departamento_modulos dm 
        WHERE dm.departamento_id = d.id AND dm.modulo_id = v_modulo_id
    );
END $$;

-- 3. Revogar acesso do usuário anon e garantir que o RLS está ativo
REVOKE ALL ON public.voluntarios FROM anon;
ALTER TABLE public.voluntarios ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para a Equipe Autorizada (Acesso Total: Ler, Criar, Editar, Apagar)
DROP POLICY IF EXISTS "Permitir SELECT em voluntarios para equipe" ON public.voluntarios;
CREATE POLICY "Permitir SELECT em voluntarios para equipe" 
ON public.voluntarios FOR SELECT TO authenticated USING (check_user_access('voluntarios'));

DROP POLICY IF EXISTS "Permitir INSERT em voluntarios para equipe" ON public.voluntarios;
CREATE POLICY "Permitir INSERT em voluntarios para equipe" 
ON public.voluntarios FOR INSERT TO authenticated WITH CHECK (check_user_access('voluntarios'));

DROP POLICY IF EXISTS "Permitir UPDATE em voluntarios para equipe" ON public.voluntarios;
CREATE POLICY "Permitir UPDATE em voluntarios para equipe" 
ON public.voluntarios FOR UPDATE TO authenticated USING (check_user_access('voluntarios')) WITH CHECK (check_user_access('voluntarios'));

DROP POLICY IF EXISTS "Permitir DELETE em voluntarios para equipe" ON public.voluntarios;
CREATE POLICY "Permitir DELETE em voluntarios para equipe" 
ON public.voluntarios FOR DELETE TO authenticated USING (check_user_access('voluntarios'));

-- 5. Política para o Próprio Voluntário (Apenas Leitura)
DROP POLICY IF EXISTS "Permitir voluntario ler proprios dados" ON public.voluntarios;
CREATE POLICY "Permitir voluntario ler proprios dados"
ON public.voluntarios FOR SELECT
TO authenticated
USING (usuario_id = auth.uid());