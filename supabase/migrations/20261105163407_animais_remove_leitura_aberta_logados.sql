-- ==============================================================================
-- Animais: remove a leitura aberta para qualquer usuário logado
-- ==============================================================================
-- A 20260824143500 criou "Permitir leitura total para usuarios logados" com
-- USING (true). A 20260913210000 criou a policy correta ("Leitura autenticada de
-- animais", exige o módulo 'operacional'), mas não removeu a antiga. Como policies
-- de mesmo comando se somam (OR), qualquer conta logada — inclusive a de quem só
-- se cadastrou como voluntário, sem módulo nenhum — lia todos os animais, com os
-- dados pessoais do adotante.
--
-- Depois desta migration: SELECT em `animais` só para quem tem o módulo
-- 'operacional' (qualquer nível). A escrita já exigia 'total'.
--
-- IDEMPOTENTE.
-- ==============================================================================

DROP POLICY IF EXISTS "Permitir leitura total para usuarios logados" ON public.animais;
