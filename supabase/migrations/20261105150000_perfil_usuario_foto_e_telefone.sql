-- ==============================================================================
-- Perfil do usuário: foto e telefone, editáveis pelo próprio usuário
-- ==============================================================================
-- 1. Novas colunas em public.usuarios (foto_url, telefone).
-- 2. RPC atualizar_meu_perfil(): é o ÚNICO caminho para o usuário editar a si
--    mesmo. Mexe só em nome/telefone/foto_url da linha de auth.uid() — nunca em
--    e-mail (que é do Auth) nem em departamentos (RBAC). Por isso não abrimos
--    uma policy de UPDATE em usuarios.
-- 3. Bucket público `avatars`: cada usuário só escreve na própria pasta
--    (`<uid>/...`). Leitura é pública (a foto aparece na sidebar).

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS foto_url text,
  ADD COLUMN IF NOT EXISTS telefone text;

CREATE OR REPLACE FUNCTION public.atualizar_meu_perfil(
  p_nome text,
  p_telefone text,
  p_foto_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'não autenticado' USING ERRCODE = '42501';
  END IF;

  IF p_nome IS NULL OR length(btrim(p_nome)) < 2 THEN
    RAISE EXCEPTION 'nome inválido' USING ERRCODE = '22023';
  END IF;

  UPDATE public.usuarios
     SET nome     = btrim(p_nome),
         telefone = NULLIF(btrim(p_telefone), ''),
         foto_url = NULLIF(btrim(p_foto_url), '')
   WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.atualizar_meu_perfil(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.atualizar_meu_perfil(text, text, text) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 4194304, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public             = EXCLUDED.public,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Avatar: enviar na propria pasta" ON storage.objects;
CREATE POLICY "Avatar: enviar na propria pasta"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Avatar: apagar da propria pasta" ON storage.objects;
CREATE POLICY "Avatar: apagar da propria pasta"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
