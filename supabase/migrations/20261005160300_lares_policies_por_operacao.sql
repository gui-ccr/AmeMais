-- ==============================================================================
-- Lares temporários: RLS por operação (KAN-101)
-- ==============================================================================
-- A migration 20260913122423 criou uma policy `FOR ALL` com
-- check_user_access('lares') (qualquer nível de acesso). A migration
-- 20260913210000 explica por que isso é um problema e corrige as outras tabelas
-- (animais, events, urgency_items, medical_records), mas `lares_temporarios`
-- ficou de fora: qualquer usuário com QUALQUER nível no módulo `lares` conseguia
-- criar, editar e apagar.
--
-- Aqui segue o mesmo padrão do projeto: ler exige qualquer nível; criar, editar
-- e apagar exigem nível 'total'.
--
-- ATENÇÃO: quem tem hoje só nível de leitura em `lares` deixa de conseguir
-- escrever (o comportamento correto, igual aos demais módulos).
--
-- IDEMPOTENTE.
-- ==============================================================================

DROP POLICY IF EXISTS "Acesso total autenticado lares" ON public.lares_temporarios;
DROP POLICY IF EXISTS "Leitura autenticada de lares"    ON public.lares_temporarios;
DROP POLICY IF EXISTS "Criacao autenticada de lares"    ON public.lares_temporarios;
DROP POLICY IF EXISTS "Atualizacao autenticada de lares" ON public.lares_temporarios;
DROP POLICY IF EXISTS "Exclusao autenticada de lares"   ON public.lares_temporarios;

CREATE POLICY "Leitura autenticada de lares"
    ON public.lares_temporarios
    FOR SELECT
    TO authenticated
    USING (public.check_user_access('lares'));

CREATE POLICY "Criacao autenticada de lares"
    ON public.lares_temporarios
    FOR INSERT
    TO authenticated
    WITH CHECK (public.check_user_access('lares', 'total'));

CREATE POLICY "Atualizacao autenticada de lares"
    ON public.lares_temporarios
    FOR UPDATE
    TO authenticated
    USING (public.check_user_access('lares', 'total'))
    WITH CHECK (public.check_user_access('lares', 'total'));

CREATE POLICY "Exclusao autenticada de lares"
    ON public.lares_temporarios
    FOR DELETE
    TO authenticated
    USING (public.check_user_access('lares', 'total'));
