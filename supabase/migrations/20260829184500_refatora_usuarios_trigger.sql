-- 1. Exclui a tabela redundante
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Cria a Ação do Gatilho
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

-- 3. Liga o Gatilho
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Cria o departamento de TI (A "cadeira" vazia)
INSERT INTO public.departamentos (nome, descricao)
VALUES ('TI', 'Equipe de Desenvolvimento e Testes do Sistema')
ON CONFLICT DO NOTHING;

-- 5. Dá a chave mestra para a cadeira de TI
INSERT INTO public.departamento_modulos (departamento_id, modulo_id, nivel_acesso)
SELECT 
    (SELECT id FROM public.departamentos WHERE nome = 'TI' LIMIT 1),
    id,
    'total'
FROM public.modulos
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. QUERY PARA PROMOVER 1 USUÁRIO A ADMIN (Documentada)
-- ============================================================================
-- Instrução: Após a equipe de Frontend criar a primeira conta, 
-- rodar o código abaixo no SQL Editor substituindo o email.
/*
INSERT INTO public.usuario_departamentos (usuario_id, departamento_id)
VALUES (
  (SELECT id FROM public.usuarios WHERE email = 'admin@amemais.org' LIMIT 1),
  (SELECT id FROM public.departamentos WHERE nome = 'TI' LIMIT 1)
);
*/