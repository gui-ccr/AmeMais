-- 1. Remove a coluna 'cargo' da tabela usuarios (Substituida pelo RBAC)
ALTER TABLE IF EXISTS public.usuarios DROP COLUMN IF EXISTS cargo;

-- 2. Exclui a tabela redundante
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. Cria as novas tabelas da arquitetura RBAC
CREATE TABLE IF NOT EXISTS public.modulos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  CONSTRAINT modulos_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.departamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  CONSTRAINT departamentos_pkey PRIMARY KEY (id)
);

-- 4. Cria as tabelas pivô com ON DELETE CASCADE (Efeito dominó de exclusão)
CREATE TABLE IF NOT EXISTS public.departamento_modulos (
  departamento_id uuid NOT NULL,
  modulo_id uuid NOT NULL,
  nivel_acesso text NOT NULL CHECK (nivel_acesso = ANY (ARRAY['total'::text, 'leitura'::text])),
  CONSTRAINT departamento_modulos_pkey PRIMARY KEY (departamento_id, modulo_id),
  CONSTRAINT departamento_modulos_departamento_id_fkey FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id) ON DELETE CASCADE,
  CONSTRAINT departamento_modulos_modulo_id_fkey FOREIGN KEY (modulo_id) REFERENCES public.modulos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.usuario_departamentos (
  usuario_id uuid NOT NULL,
  departamento_id uuid NOT NULL,
  CONSTRAINT usuario_departamentos_pkey PRIMARY KEY (usuario_id, departamento_id),
  CONSTRAINT usuario_departamentos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
  CONSTRAINT usuario_departamentos_departamento_id_fkey FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id) ON DELETE CASCADE
);

-- 5. Cria a Ação do Gatilho
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_departamento_id uuid;
  v_rls_ativo boolean;
BEGIN
  -- AVALIAÇÃO DE RLS: Verifica se o RLS está ativado na tabela 'usuarios'
  SELECT relrowsecurity INTO v_rls_ativo 
  FROM pg_class 
  WHERE oid = 'public.usuarios'::regclass;
  
  -- Se não estiver ativo, lança apenas um aviso (WARNING), mas não para o código (não dá erro)
  IF v_rls_ativo IS NOT TRUE THEN
    RAISE WARNING 'Aviso: RLS desativado na tabela usuarios. O cadastro prosseguirá.';
  END IF;

  -- CORREÇÃO DO NOME: Insere o usuário pegando o nome ou a primeira parte do email
  INSERT INTO public.usuarios (id, email, nome)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1))
  );

  -- VERIFICAÇÃO DE DEPARTAMENTO: Busca o ID do Voluntariado
  SELECT id INTO v_departamento_id FROM public.departamentos WHERE nome = 'Voluntariado' LIMIT 1;
  
  -- Lança a exceção (erro) personalizada caso o departamento não exista
  IF v_departamento_id IS NULL THEN
    RAISE EXCEPTION 'Erro Crítico: Departamento "Voluntariado" não encontrado no sistema. Cadastro abortado.';
  END IF;

  -- Se passou pelas verificações, vincula o usuário novo
  INSERT INTO public.usuario_departamentos (usuario_id, departamento_id)
  VALUES (new.id, v_departamento_id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Liga o Gatilho
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Cria os departamentos iniciais (TI e Voluntariado)
INSERT INTO public.departamentos (nome, descricao)
VALUES 
  ('TI', 'Equipe de Desenvolvimento e Testes do Sistema'),
  ('Voluntariado', 'Acesso padrão para todos os novos cadastros')
ON CONFLICT DO NOTHING;

-- 8. Dá a chave mestra para a cadeira de TI
INSERT INTO public.departamento_modulos (departamento_id, modulo_id, nivel_acesso)
SELECT 
    (SELECT id FROM public.departamentos WHERE nome = 'TI' LIMIT 1),
    id,
    'total'
FROM public.modulos
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. QUERY PARA PROMOVER 1 USUÁRIO A ADMIN (Documentada)
-- ============================================================================
/*
INSERT INTO public.usuario_departamentos (usuario_id, departamento_id)
VALUES (
  (SELECT id FROM public.usuarios WHERE email = 'admin@amemais.org' LIMIT 1),
  (SELECT id FROM public.departamentos WHERE nome = 'TI' LIMIT 1)
);
*/