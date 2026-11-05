-- ==============================================================================
-- Tela "Equipe e Acessos": funções (RPC) para gerenciar membros e departamentos
-- ==============================================================================
-- As tabelas de RBAC (departamentos, departamento_modulos, usuario_departamentos...)
-- não têm policy para `authenticated` de propósito. Em vez de dar acesso direto a
-- elas, a API chama as funções abaixo com o token do próprio usuário.
--
-- Todas são SECURITY DEFINER com search_path fixo, e CADA UMA exige por conta própria
-- `check_user_access('admin', 'total')` — não dependem de a API ter checado antes.
--
-- Regras anti-trava (valem no banco, não só na tela):
--   (a) ninguém desativa a própria conta nem redefine a própria senha por aqui;
--   (b) ninguém tira de si mesmo o acesso admin/total;
--   (c) nunca pode sobrar zero usuários ATIVOS (não banidos no Auth) com admin/total.
-- (b) e (c) são conferidas DEPOIS da mudança, dentro da mesma transação: se falhar,
-- o RAISE desfaz tudo (atomicidade). Mudanças concorrentes são serializadas por um
-- advisory lock transacional.
--
-- Códigos de erro (SQLSTATE) usados, traduzidos pela API:
--   42501  sem permissão (403)
--   P0002  não encontrado (404)
--   EQ400  dado inválido (400)
--   EQ409  conflito com regra de negócio / anti-trava (409)
--
-- Migration idempotente: CREATE OR REPLACE + REVOKE/GRANT repetíveis.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Helpers internos (não expostos a anon/authenticated)
-- ------------------------------------------------------------------------------

-- Exige admin/total de quem chama e serializa as mudanças de acesso.
CREATE OR REPLACE FUNCTION public.equipe_exigir_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.check_user_access('admin', 'total') THEN
    RAISE EXCEPTION 'Você não tem permissão para gerenciar a equipe' USING ERRCODE = '42501';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('equipe_acessos'));
END;
$$;

-- Ids de quem tem admin/total (por departamento ou, como em check_user_access, por cargo legado) e NÃO está banido.
CREATE OR REPLACE FUNCTION public.equipe_admins_ativos()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT DISTINCT acesso.usuario_id
  FROM (
    SELECT ud.usuario_id
    FROM public.usuario_departamentos ud
    JOIN public.departamento_modulos dm ON dm.departamento_id = ud.departamento_id
    JOIN public.modulos m ON m.id = dm.modulo_id
    WHERE m.slug = 'admin' AND dm.nivel_acesso = 'total'
    UNION
    SELECT uc.usuario_id
    FROM public.usuario_cargos uc
    JOIN public.cargo_modulos cm ON cm.cargo_id = uc.cargo_id
    JOIN public.modulos m ON m.id = cm.modulo_id
    WHERE m.slug = 'admin' AND cm.nivel_acesso = 'total'
  ) acesso
  JOIN auth.users u ON u.id = acesso.usuario_id
  WHERE u.banned_until IS NULL OR u.banned_until <= now();
$$;

-- Confere (b) e (c) depois de uma mudança. O RAISE desfaz a transação inteira.
CREATE OR REPLACE FUNCTION public.equipe_conferir_anti_trava()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.check_user_access('admin', 'total') THEN
    RAISE EXCEPTION 'Você não pode remover o seu próprio acesso de administrador' USING ERRCODE = 'EQ409';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.equipe_admins_ativos()) THEN
    RAISE EXCEPTION 'A mudança deixaria o sistema sem nenhum administrador ativo' USING ERRCODE = 'EQ409';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.equipe_exigir_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.equipe_admins_ativos() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.equipe_conferir_anti_trava() FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------------------
-- Autorização de ações sobre a conta (o ban/senha em si é feito pela API no Auth)
-- ------------------------------------------------------------------------------

-- Só confirma que quem chama é admin/total (usada antes de criar um membro).
CREATE OR REPLACE FUNCTION public.equipe_autorizar()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.equipe_exigir_admin();
END;
$$;

-- p_acao: 'desativar' | 'ativar' | 'redefinir_senha'. Falha se a ação for proibida.
CREATE OR REPLACE FUNCTION public.equipe_autorizar_acao_sobre_conta(p_usuario_id uuid, p_acao text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.equipe_exigir_admin();

  IF p_acao NOT IN ('desativar', 'ativar', 'redefinir_senha') THEN
    RAISE EXCEPTION 'Ação inválida' USING ERRCODE = 'EQ400';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE id = p_usuario_id) THEN
    RAISE EXCEPTION 'Membro não encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF p_usuario_id = auth.uid() THEN
    IF p_acao = 'desativar' THEN
      RAISE EXCEPTION 'Você não pode desativar o seu próprio acesso' USING ERRCODE = 'EQ409';
    ELSIF p_acao = 'redefinir_senha' THEN
      RAISE EXCEPTION 'Para trocar a sua própria senha, use a opção de trocar senha' USING ERRCODE = 'EQ409';
    END IF;
  END IF;

  -- (c) desativar quem é o último administrador ativo deixaria o sistema sem ninguém.
  IF p_acao = 'desativar'
     AND NOT EXISTS (SELECT 1 FROM public.equipe_admins_ativos() a WHERE a <> p_usuario_id) THEN
    RAISE EXCEPTION 'Este é o último administrador ativo; o sistema não pode ficar sem um' USING ERRCODE = 'EQ409';
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- Leitura
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.equipe_listar_membros(p_busca text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  nome text,
  email text,
  ativo boolean,
  ultimo_acesso timestamptz,
  departamentos jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_busca text := nullif(btrim(p_busca), '');
BEGIN
  IF auth.uid() IS NULL OR NOT public.check_user_access('admin', 'total') THEN
    RAISE EXCEPTION 'Você não tem permissão para gerenciar a equipe' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    us.id,
    us.nome,
    us.email,
    (au.banned_until IS NULL OR au.banned_until <= now()) AS ativo,
    au.last_sign_in_at,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('id', d.id, 'nome', d.nome) ORDER BY d.nome)
       FROM public.usuario_departamentos ud
       JOIN public.departamentos d ON d.id = ud.departamento_id
       WHERE ud.usuario_id = us.id),
      '[]'::jsonb
    )
  FROM public.usuarios us
  LEFT JOIN auth.users au ON au.id = us.id
  WHERE v_busca IS NULL
     OR us.nome ILIKE '%' || replace(replace(replace(v_busca, '\', '\\'), '%', '\%'), '_', '\_') || '%'
     OR us.email ILIKE '%' || replace(replace(replace(v_busca, '\', '\\'), '%', '\%'), '_', '\_') || '%'
  ORDER BY us.nome, us.email;
END;
$$;

-- Departamentos com a matriz completa: uma entrada por módulo (nivel NULL = sem acesso).
CREATE OR REPLACE FUNCTION public.equipe_listar_departamentos()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.check_user_access('admin', 'total') THEN
    RAISE EXCEPTION 'Você não tem permissão para gerenciar a equipe' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'modulos',
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id', m.id, 'nome', m.nome, 'slug', m.slug) ORDER BY m.nome)
              FROM public.modulos m), '[]'::jsonb),
    'departamentos',
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'nome', d.nome,
          'descricao', d.descricao,
          'totalMembros', (SELECT count(*) FROM public.usuario_departamentos ud WHERE ud.departamento_id = d.id),
          'permissoes', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object('moduloId', m.id, 'nivel', dm.nivel_acesso) ORDER BY m.nome), '[]'::jsonb)
            FROM public.modulos m
            LEFT JOIN public.departamento_modulos dm ON dm.modulo_id = m.id AND dm.departamento_id = d.id
          )
        )
        ORDER BY d.nome
      )
      FROM public.departamentos d
    ), '[]'::jsonb)
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- Escrita (atômica)
-- ------------------------------------------------------------------------------

-- Troca TODOS os departamentos do membro pelos informados.
CREATE OR REPLACE FUNCTION public.equipe_definir_departamentos_do_membro(p_usuario_id uuid, p_departamento_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ids uuid[] := COALESCE(
    (SELECT array_agg(DISTINCT x) FROM unnest(COALESCE(p_departamento_ids, ARRAY[]::uuid[])) x), ARRAY[]::uuid[]
  );
BEGIN
  PERFORM public.equipe_exigir_admin();

  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE id = p_usuario_id) THEN
    RAISE EXCEPTION 'Membro não encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF (SELECT count(*) FROM public.departamentos WHERE id = ANY (v_ids)) <> cardinality(v_ids) THEN
    RAISE EXCEPTION 'Algum departamento informado não existe' USING ERRCODE = 'EQ400';
  END IF;

  DELETE FROM public.usuario_departamentos WHERE usuario_id = p_usuario_id;
  INSERT INTO public.usuario_departamentos (usuario_id, departamento_id)
  SELECT p_usuario_id, unnest(v_ids);

  PERFORM public.equipe_conferir_anti_trava();
END;
$$;

CREATE OR REPLACE FUNCTION public.equipe_criar_departamento(p_nome text, p_descricao text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_nome text := btrim(COALESCE(p_nome, ''));
  v_id uuid;
BEGIN
  PERFORM public.equipe_exigir_admin();

  IF char_length(v_nome) < 2 OR char_length(v_nome) > 80 THEN
    RAISE EXCEPTION 'O nome do departamento deve ter entre 2 e 80 caracteres' USING ERRCODE = 'EQ400';
  END IF;

  IF EXISTS (SELECT 1 FROM public.departamentos WHERE lower(nome) = lower(v_nome)) THEN
    RAISE EXCEPTION 'Já existe um departamento com este nome' USING ERRCODE = 'EQ409';
  END IF;

  INSERT INTO public.departamentos (nome, descricao)
  VALUES (v_nome, nullif(btrim(COALESCE(p_descricao, '')), ''))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.equipe_atualizar_departamento(p_id uuid, p_nome text, p_descricao text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_nome text := btrim(COALESCE(p_nome, ''));
  v_atual text;
BEGIN
  PERFORM public.equipe_exigir_admin();

  SELECT nome INTO v_atual FROM public.departamentos WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Departamento não encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF char_length(v_nome) < 2 OR char_length(v_nome) > 80 THEN
    RAISE EXCEPTION 'O nome do departamento deve ter entre 2 e 80 caracteres' USING ERRCODE = 'EQ400';
  END IF;

  -- O gatilho handle_new_user procura o departamento "Voluntariado" pelo nome: renomear quebraria o cadastro de novos usuários.
  IF v_atual = 'Voluntariado' AND v_nome <> 'Voluntariado' THEN
    RAISE EXCEPTION 'O departamento "Voluntariado" não pode ser renomeado: todo usuário novo entra nele' USING ERRCODE = 'EQ409';
  END IF;

  IF EXISTS (SELECT 1 FROM public.departamentos WHERE lower(nome) = lower(v_nome) AND id <> p_id) THEN
    RAISE EXCEPTION 'Já existe um departamento com este nome' USING ERRCODE = 'EQ409';
  END IF;

  UPDATE public.departamentos
  SET nome = v_nome, descricao = nullif(btrim(COALESCE(p_descricao, '')), '')
  WHERE id = p_id;
END;
$$;

-- p_permissoes: [{"moduloId": uuid, "nivel": "total" | "leitura" | null}]. Substitui a matriz inteira do departamento.
CREATE OR REPLACE FUNCTION public.equipe_salvar_matriz_do_departamento(p_departamento_id uuid, p_permissoes jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item jsonb;
  v_modulo_id uuid;
  v_nivel text;
BEGIN
  PERFORM public.equipe_exigir_admin();

  IF NOT EXISTS (SELECT 1 FROM public.departamentos WHERE id = p_departamento_id) THEN
    RAISE EXCEPTION 'Departamento não encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF p_permissoes IS NULL OR jsonb_typeof(p_permissoes) <> 'array' THEN
    RAISE EXCEPTION 'Permissões inválidas' USING ERRCODE = 'EQ400';
  END IF;

  DELETE FROM public.departamento_modulos WHERE departamento_id = p_departamento_id;

  -- Qualquer RAISE no laço desfaz o DELETE acima (a função inteira é uma transação).
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_permissoes) LOOP
    IF jsonb_typeof(v_item) <> 'object' THEN
      RAISE EXCEPTION 'Permissões inválidas' USING ERRCODE = 'EQ400';
    END IF;

    BEGIN
      v_modulo_id := (v_item ->> 'moduloId')::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Módulo inválido nas permissões' USING ERRCODE = 'EQ400';
    END;
    v_nivel := v_item ->> 'nivel';

    IF v_modulo_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.modulos WHERE id = v_modulo_id) THEN
      RAISE EXCEPTION 'Algum módulo informado não existe' USING ERRCODE = 'EQ400';
    END IF;
    IF v_nivel IS NOT NULL AND v_nivel NOT IN ('total', 'leitura') THEN
      RAISE EXCEPTION 'Nível de acesso inválido' USING ERRCODE = 'EQ400';
    END IF;

    IF v_nivel IS NOT NULL THEN
      BEGIN
        INSERT INTO public.departamento_modulos (departamento_id, modulo_id, nivel_acesso)
        VALUES (p_departamento_id, v_modulo_id, v_nivel);
      EXCEPTION WHEN unique_violation THEN
        RAISE EXCEPTION 'Módulo repetido nas permissões' USING ERRCODE = 'EQ400';
      END;
    END IF;
  END LOOP;

  PERFORM public.equipe_conferir_anti_trava();
END;
$$;

CREATE OR REPLACE FUNCTION public.equipe_remover_departamento(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_nome text;
BEGIN
  PERFORM public.equipe_exigir_admin();

  SELECT nome INTO v_nome FROM public.departamentos WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Departamento não encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF v_nome = 'Voluntariado' THEN
    RAISE EXCEPTION 'O departamento "Voluntariado" não pode ser apagado: todo usuário novo entra nele' USING ERRCODE = 'EQ409';
  END IF;

  IF EXISTS (SELECT 1 FROM public.usuario_departamentos WHERE departamento_id = p_id) THEN
    RAISE EXCEPTION 'Este departamento ainda tem membros; mova-os para outro antes de apagar' USING ERRCODE = 'EQ409';
  END IF;

  DELETE FROM public.departamentos WHERE id = p_id;

  PERFORM public.equipe_conferir_anti_trava();
END;
$$;

REVOKE ALL ON FUNCTION public.equipe_autorizar() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.equipe_autorizar_acao_sobre_conta(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.equipe_listar_membros(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.equipe_listar_departamentos() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.equipe_definir_departamentos_do_membro(uuid, uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.equipe_criar_departamento(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.equipe_atualizar_departamento(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.equipe_salvar_matriz_do_departamento(uuid, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.equipe_remover_departamento(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.equipe_autorizar() TO authenticated;
GRANT EXECUTE ON FUNCTION public.equipe_autorizar_acao_sobre_conta(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.equipe_listar_membros(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.equipe_listar_departamentos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.equipe_definir_departamentos_do_membro(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.equipe_criar_departamento(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.equipe_atualizar_departamento(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.equipe_salvar_matriz_do_departamento(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.equipe_remover_departamento(uuid) TO authenticated;
