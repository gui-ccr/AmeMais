-- ==============================================================================
-- 1. check_user_access PASSA A RESPEITAR nivel_acesso ('leitura' vs 'total')
-- ==============================================================================
-- A versão original (20260906213400_estruturacao_cargos_e_rls.sql) só
-- verificava se existia ALGUM vínculo (departamento ou cargo) com o módulo,
-- ignorando a coluna nivel_acesso — ou seja, quem tinha só 'leitura' também
-- passava em políticas `FOR ALL` (conseguia inserir/editar/apagar). Esta
-- versão recebe um nível mínimo exigido (default 'leitura', pra manter as
-- chamadas antigas com 1 argumento funcionando) e só libera 'total' quando
-- o melhor nível encontrado (departamento OU cargo, o maior dos dois) for
-- de fato 'total'.
CREATE OR REPLACE FUNCTION public.check_user_access(modulo_slug text, nivel_minimo text DEFAULT 'leitura')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_melhor_nivel text;
BEGIN
  SELECT acessos.nivel_acesso INTO v_melhor_nivel
  FROM (
    SELECT dm.nivel_acesso
    FROM public.usuario_departamentos ud
    JOIN public.departamento_modulos dm ON ud.departamento_id = dm.departamento_id
    JOIN public.modulos m ON dm.modulo_id = m.id
    WHERE ud.usuario_id = auth.uid() AND m.slug = modulo_slug

    UNION

    SELECT cm.nivel_acesso
    FROM public.usuario_cargos uc
    JOIN public.cargo_modulos cm ON uc.cargo_id = cm.cargo_id
    JOIN public.modulos m ON cm.modulo_id = m.id
    WHERE uc.usuario_id = auth.uid() AND m.slug = modulo_slug
  ) acessos
  ORDER BY CASE acessos.nivel_acesso WHEN 'total' THEN 1 ELSE 2 END
  LIMIT 1;

  IF v_melhor_nivel IS NULL THEN
    RETURN false;
  END IF;

  IF nivel_minimo = 'total' THEN
    RETURN v_melhor_nivel = 'total';
  END IF;

  RETURN true;
END;
$$;

-- ==============================================================================
-- 2. POLÍTICAS POR OPERAÇÃO (SELECT exige qualquer nível; escrita exige 'total')
-- ==============================================================================
-- Antes, cada tabela tinha 1 política `FOR ALL` cobrindo SELECT/INSERT/
-- UPDATE/DELETE de uma vez — o que, somado ao bug acima, deixava qualquer
-- nível de acesso apto a escrever. Separar por operação também é pré-
-- requisito pra `apps/api` poder confiar só na RLS (sem reimplementar a
-- checagem no backend, ver apps/api/src/middleware/auth.ts +
-- lib/supabase.ts:createSupabaseForUser).

-- ------------------------------------------------------------------------------
-- animais (e medical_records): usa o módulo 'operacional', que é o único
-- realmente cadastrado em public.modulos pra "Gestão de Animais e
-- Prontuários" — as políticas antigas apontavam pra 'animais'/'saude_animal',
-- slugs que nunca foram inseridos em public.modulos, então NINGUÉM (nem TI)
-- de fato passava nelas. Ficava só a aparência de estar protegido.
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Acesso total autenticado para animais" ON public.animais;

CREATE POLICY "Leitura autenticada de animais"
  ON public.animais
  FOR SELECT
  TO authenticated
  USING (public.check_user_access('operacional'));

CREATE POLICY "Criacao autenticada de animais"
  ON public.animais
  FOR INSERT
  TO authenticated
  WITH CHECK (public.check_user_access('operacional', 'total'));

CREATE POLICY "Atualizacao autenticada de animais"
  ON public.animais
  FOR UPDATE
  TO authenticated
  USING (public.check_user_access('operacional', 'total'))
  WITH CHECK (public.check_user_access('operacional', 'total'));

CREATE POLICY "Exclusao autenticada de animais"
  ON public.animais
  FOR DELETE
  TO authenticated
  USING (public.check_user_access('operacional', 'total'));

DROP POLICY IF EXISTS "Acesso total autenticado saude_animal" ON public.medical_records;

CREATE POLICY "Leitura autenticada de prontuarios"
  ON public.medical_records
  FOR SELECT
  TO authenticated
  USING (public.check_user_access('operacional'));

CREATE POLICY "Criacao autenticada de prontuarios"
  ON public.medical_records
  FOR INSERT
  TO authenticated
  WITH CHECK (public.check_user_access('operacional', 'total'));

CREATE POLICY "Atualizacao autenticada de prontuarios"
  ON public.medical_records
  FOR UPDATE
  TO authenticated
  USING (public.check_user_access('operacional', 'total'))
  WITH CHECK (public.check_user_access('operacional', 'total'));

CREATE POLICY "Exclusao autenticada de prontuarios"
  ON public.medical_records
  FOR DELETE
  TO authenticated
  USING (public.check_user_access('operacional', 'total'));

-- ------------------------------------------------------------------------------
-- events (módulo 'campanhas')
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Acesso total autenticado eventos" ON public.events;

CREATE POLICY "Leitura autenticada de eventos"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (public.check_user_access('campanhas'));

CREATE POLICY "Criacao autenticada de eventos"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (public.check_user_access('campanhas', 'total'));

CREATE POLICY "Atualizacao autenticada de eventos"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (public.check_user_access('campanhas', 'total'))
  WITH CHECK (public.check_user_access('campanhas', 'total'));

CREATE POLICY "Exclusao autenticada de eventos"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (public.check_user_access('campanhas', 'total'));

-- ------------------------------------------------------------------------------
-- urgency_items (módulo 'urgencias')
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Acesso total autenticado urgencias" ON public.urgency_items;

CREATE POLICY "Leitura autenticada de urgencias"
  ON public.urgency_items
  FOR SELECT
  TO authenticated
  USING (public.check_user_access('urgencias'));

CREATE POLICY "Criacao autenticada de urgencias"
  ON public.urgency_items
  FOR INSERT
  TO authenticated
  WITH CHECK (public.check_user_access('urgencias', 'total'));

CREATE POLICY "Atualizacao autenticada de urgencias"
  ON public.urgency_items
  FOR UPDATE
  TO authenticated
  USING (public.check_user_access('urgencias', 'total'))
  WITH CHECK (public.check_user_access('urgencias', 'total'));

CREATE POLICY "Exclusao autenticada de urgencias"
  ON public.urgency_items
  FOR DELETE
  TO authenticated
  USING (public.check_user_access('urgencias', 'total'));

-- ==============================================================================
-- 3. BACKFILL: departamento "TI" ganha 'total' nos módulos criados depois dele
-- ==============================================================================
-- O seed original (20260829184500_refatora_usuarios_trigger.sql) deu 'total'
-- em "TI" pra todo módulo existente NAQUELE momento (financeiro, operacional,
-- admin). 'campanhas' e 'urgencias' só foram criados depois
-- (20260906220500), então "TI" nunca ganhou acesso a eles — sem isso, nem o
-- departamento mais privilegiado do sistema conseguiria mexer em
-- eventos/urgências.
INSERT INTO public.departamento_modulos (departamento_id, modulo_id, nivel_acesso)
SELECT
    (SELECT id FROM public.departamentos WHERE nome = 'TI' LIMIT 1),
    m.id,
    'total'
FROM public.modulos m
WHERE NOT EXISTS (
  SELECT 1 FROM public.departamento_modulos dm
  WHERE dm.departamento_id = (SELECT id FROM public.departamentos WHERE nome = 'TI' LIMIT 1)
    AND dm.modulo_id = m.id
);
