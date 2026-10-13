-- ==============================================================================
-- Voluntários: escrita exige nível 'total' (KAN-75)
-- ==============================================================================
-- A 20261013123000 criou INSERT/UPDATE/DELETE com check_user_access('voluntarios'),
-- que por padrão aceita qualquer nível (inclusive 'leitura'). Mesmo padrão das
-- outras tabelas (ver 20261005160300_lares_policies_por_operacao.sql):
-- SELECT com qualquer nível, escrita só com 'total'.
--
-- IDEMPOTENTE.
-- ==============================================================================

DROP POLICY IF EXISTS "Permitir INSERT em voluntarios para equipe" ON public.voluntarios;
CREATE POLICY "Permitir INSERT em voluntarios para equipe"
ON public.voluntarios FOR INSERT TO authenticated
WITH CHECK (public.check_user_access('voluntarios', 'total'));

DROP POLICY IF EXISTS "Permitir UPDATE em voluntarios para equipe" ON public.voluntarios;
CREATE POLICY "Permitir UPDATE em voluntarios para equipe"
ON public.voluntarios FOR UPDATE TO authenticated
USING (public.check_user_access('voluntarios', 'total'))
WITH CHECK (public.check_user_access('voluntarios', 'total'));

DROP POLICY IF EXISTS "Permitir DELETE em voluntarios para equipe" ON public.voluntarios;
CREATE POLICY "Permitir DELETE em voluntarios para equipe"
ON public.voluntarios FOR DELETE TO authenticated
USING (public.check_user_access('voluntarios', 'total'));
