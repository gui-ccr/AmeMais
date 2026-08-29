-- 1. Exclui a tabela redundante
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Cria a Ação do Gatilho
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email)
  VALUES (new.id, new.email);

  -- Todo usuário novo ganha o cargo de Voluntário por padrão
  INSERT INTO public.usuario_departamentos (usuario_id, departamento_id)
  SELECT new.id, id FROM public.departamentos WHERE nome = 'Voluntariado' LIMIT 1;

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
VALUES ('TI', 'Equipe de Desenvolvimento e Testes do Sistema');

-- 5. Dá a chave mestra para a cadeira de TI
INSERT INTO public.departamento_modulos (departamento_id, modulo_id, nivel_acesso)
SELECT 
    (SELECT id FROM public.departamentos WHERE nome = 'TI' LIMIT 1),
    id,
    'total'
FROM public.modulos;