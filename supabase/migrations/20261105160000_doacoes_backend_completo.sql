-- ==============================================================================
-- Doações com backend real (problema #1 dos testes)
-- ==============================================================================
-- 1. Novas colunas em public.doacoes (descrição, quantidade + unidade, local de
--    coleta em texto livre, foto, vínculo com urgência e auditoria "registrado por").
-- 2. Módulo de acesso 'doacoes' (herda os vínculos de quem já tinha 'financeiro').
-- 3. RLS por operação: SELECT com qualquer nível, escrita só com 'total'.
-- 4. Trigger que preenche registrado_por_* a partir do usuário autenticado
--    (o cliente nunca informa quem registrou).
-- 5. Policy de Storage para subir a foto em animal-photos/doacoes/.
--
-- A urgência vinculada é só REFERÊNCIA: não soma nada em valor_arrecadado
-- (as unidades podem diferir e editar/apagar a doação teria de estornar o valor).
--
-- IDEMPOTENTE.
-- ==============================================================================

-- 1. COLUNAS ------------------------------------------------------------------
-- Linhas antigas (se houver) recebem valores neutros; depois o default sai.
ALTER TABLE public.doacoes
  ADD COLUMN IF NOT EXISTS descricao text NOT NULL DEFAULT 'Doação sem descrição',
  ADD COLUMN IF NOT EXISTS quantidade numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS unidade text NOT NULL DEFAULT 'un',
  ADD COLUMN IF NOT EXISTS local_coleta text NOT NULL DEFAULT 'Não informado',
  ADD COLUMN IF NOT EXISTS foto_url text,
  ADD COLUMN IF NOT EXISTS urgencia_id uuid REFERENCES public.urgency_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS registrado_por_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS registrado_por_nome text NOT NULL DEFAULT 'Não informado',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.doacoes
  ALTER COLUMN descricao DROP DEFAULT,
  ALTER COLUMN quantidade DROP DEFAULT,
  ALTER COLUMN unidade DROP DEFAULT,
  ALTER COLUMN local_coleta DROP DEFAULT,
  ALTER COLUMN registrado_por_nome DROP DEFAULT;

UPDATE public.doacoes SET data_entrada = CURRENT_DATE WHERE data_entrada IS NULL;
ALTER TABLE public.doacoes ALTER COLUMN data_entrada SET NOT NULL;

ALTER TABLE public.doacoes DROP CONSTRAINT IF EXISTS doacoes_quantidade_positiva;
ALTER TABLE public.doacoes ADD CONSTRAINT doacoes_quantidade_positiva CHECK (quantidade > 0);

ALTER TABLE public.doacoes DROP CONSTRAINT IF EXISTS doacoes_unidade_valida;
ALTER TABLE public.doacoes ADD CONSTRAINT doacoes_unidade_valida CHECK (unidade IN ('kg', 'un', 'L', 'R$'));

CREATE INDEX IF NOT EXISTS doacoes_urgencia_id_idx ON public.doacoes (urgencia_id);
CREATE INDEX IF NOT EXISTS doacoes_data_entrada_idx ON public.doacoes (data_entrada DESC, created_at DESC);

-- 2. MÓDULO 'doacoes' ---------------------------------------------------------
INSERT INTO public.modulos (nome, slug)
VALUES ('Gestão de Doações', 'doacoes')
ON CONFLICT (slug) DO NOTHING;

-- Quem já acessava 'financeiro' (departamento ou cargo) passa a acessar 'doacoes'
-- com o mesmo nível. Ajustes finos ficam por conta do admin.
INSERT INTO public.departamento_modulos (departamento_id, modulo_id, nivel_acesso)
SELECT dm.departamento_id, novo.id, dm.nivel_acesso
FROM public.departamento_modulos dm
JOIN public.modulos antigo ON antigo.id = dm.modulo_id AND antigo.slug = 'financeiro'
CROSS JOIN (SELECT id FROM public.modulos WHERE slug = 'doacoes') novo
ON CONFLICT DO NOTHING;

INSERT INTO public.cargo_modulos (cargo_id, modulo_id, nivel_acesso)
SELECT cm.cargo_id, novo.id, cm.nivel_acesso
FROM public.cargo_modulos cm
JOIN public.modulos antigo ON antigo.id = cm.modulo_id AND antigo.slug = 'financeiro'
CROSS JOIN (SELECT id FROM public.modulos WHERE slug = 'doacoes') novo
ON CONFLICT DO NOTHING;

-- 3. RLS ----------------------------------------------------------------------
REVOKE ALL ON public.doacoes FROM anon;
ALTER TABLE public.doacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de doacoes" ON public.doacoes;
CREATE POLICY "Leitura de doacoes"
  ON public.doacoes FOR SELECT TO authenticated
  USING (public.check_user_access('doacoes'));

DROP POLICY IF EXISTS "Criacao de doacoes" ON public.doacoes;
CREATE POLICY "Criacao de doacoes"
  ON public.doacoes FOR INSERT TO authenticated
  WITH CHECK (public.check_user_access('doacoes', 'total'));

DROP POLICY IF EXISTS "Atualizacao de doacoes" ON public.doacoes;
CREATE POLICY "Atualizacao de doacoes"
  ON public.doacoes FOR UPDATE TO authenticated
  USING (public.check_user_access('doacoes', 'total'))
  WITH CHECK (public.check_user_access('doacoes', 'total'));

DROP POLICY IF EXISTS "Remocao de doacoes" ON public.doacoes;
CREATE POLICY "Remocao de doacoes"
  ON public.doacoes FOR DELETE TO authenticated
  USING (public.check_user_access('doacoes', 'total'));

-- 4. AUDITORIA: registrado_por_* vem do usuário autenticado -------------------
CREATE OR REPLACE FUNCTION public.doacoes_definir_registrado_por()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.registrado_por_id := auth.uid();
    NEW.registrado_por_nome := COALESCE(
      (SELECT NULLIF(btrim(u.nome), '') FROM public.usuarios u WHERE u.id = auth.uid()),
      'Não informado'
    );
    NEW.created_at := now();
  ELSE
    -- A auditoria não muda numa edição.
    NEW.registrado_por_id := OLD.registrado_por_id;
    NEW.registrado_por_nome := OLD.registrado_por_nome;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS doacoes_definir_registrado_por ON public.doacoes;
CREATE TRIGGER doacoes_definir_registrado_por
  BEFORE INSERT OR UPDATE ON public.doacoes
  FOR EACH ROW EXECUTE FUNCTION public.doacoes_definir_registrado_por();

-- 5. STORAGE: foto da doação em animal-photos/doacoes/ -----------------------
DROP POLICY IF EXISTS "Upload de fotos de doacoes" ON storage.objects;
CREATE POLICY "Upload de fotos de doacoes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'animal-photos'
    AND name LIKE 'doacoes/%'
    AND public.check_user_access('doacoes', 'total')
  );
