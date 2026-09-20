-- ==============================================================================
-- FIX: login retornava 406 (PGRST116 "0 rows") ao buscar o perfil do usuário
-- ==============================================================================
-- public.usuarios e public.usuario_departamentos têm RLS habilitado
-- (relrowsecurity = true) desde que os módulos de RBAC foram criados, mas
-- nunca ganharam nenhuma policy de SELECT — só public.departamentos tem
-- ("Permitir leitura de departamentos"). Sem policy, o Postgres nega toda
-- leitura pro papel authenticated, então a query de
-- apps/web-admin/src/features/auth/services/auth-service.ts (getOwnProfile,
-- usada logo após o login) sempre voltava 0 linhas via PostgREST — mesmo a
-- linha existindo (uma query no SQL Editor bypassa RLS e sempre a achava).
--
-- check_user_access() (usada pelas policies de animais/eventos/urgências)
-- não sofre com isso porque é SECURITY DEFINER e ignora RLS ao consultar
-- usuario_departamentos internamente.
--
-- Libera apenas o próprio registro: cada usuário autenticado só enxerga a
-- si mesmo e seus próprios vínculos de departamento.

CREATE POLICY "Leitura do proprio usuario"
  ON public.usuarios
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Leitura dos proprios vinculos de departamento"
  ON public.usuario_departamentos
  FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());
