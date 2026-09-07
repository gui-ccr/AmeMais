-- ==============================================================================
-- 1. ESTRUTURA DE CARGOS E PERMISSÕES (WHITELIST / ADITIVO)
-- ==============================================================================

-- Cria a tabela de Cargos atrelada aos Departamentos
CREATE TABLE public.cargos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  departamento_id uuid NOT NULL,
  CONSTRAINT cargos_pkey PRIMARY KEY (id),
  CONSTRAINT cargos_departamento_id_fkey FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id) ON DELETE CASCADE
);

-- Cria a tabela de permissões específicas do Cargo (Os módulos que o cargo tem a mais)
CREATE TABLE public.cargo_modulos (
  cargo_id uuid NOT NULL,
  modulo_id uuid NOT NULL,
  nivel_acesso text NOT NULL CHECK (nivel_acesso = ANY (ARRAY['total'::text, 'leitura'::text])),
  CONSTRAINT cargo_modulos_pkey PRIMARY KEY (cargo_id, modulo_id),
  CONSTRAINT cargo_modulos_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id) ON DELETE CASCADE,
  CONSTRAINT cargo_modulos_modulo_id_fkey FOREIGN KEY (modulo_id) REFERENCES public.modulos(id) ON DELETE CASCADE
);

-- Cria o vínculo do Usuário com o Cargo
CREATE TABLE public.usuario_cargos (
  usuario_id uuid NOT NULL,
  cargo_id uuid NOT NULL,
  CONSTRAINT usuario_cargos_pkey PRIMARY KEY (usuario_id, cargo_id),
  CONSTRAINT usuario_cargos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
  CONSTRAINT usuario_cargos_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id) ON DELETE CASCADE
);

-- ==============================================================================
-- 2. MOTOR DO RLS (FUNÇÃO DE CHECAGEM DINÂMICA)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_user_access(modulo_slug text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tem_acesso boolean;
BEGIN
  -- A matemática da segurança (Soma Depto + Cargo)
  SELECT EXISTS (
    -- Olha se o Departamento tem a permissão
    SELECT 1 
    FROM public.usuario_departamentos ud
    JOIN public.departamento_modulos dm ON ud.departamento_id = dm.departamento_id
    JOIN public.modulos m ON dm.modulo_id = m.id
    WHERE ud.usuario_id = auth.uid() AND m.slug = modulo_slug
    
    UNION
    
    -- Olha se o Cargo tem a permissão extra
    SELECT 1
    FROM public.usuario_cargos uc
    JOIN public.cargo_modulos cm ON uc.cargo_id = cm.cargo_id
    JOIN public.modulos m ON cm.modulo_id = m.id
    WHERE uc.usuario_id = auth.uid() AND m.slug = modulo_slug
  ) INTO v_tem_acesso;

  RETURN v_tem_acesso;
END;
$$;

-- ==============================================================================
-- 3. ATIVAÇÃO DA BLINDAGEM (RLS NAS TABELAS)
-- ==============================================================================

-- Força a ativação do RLS nas tabelas
ALTER TABLE public.animais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Limpa políticas velhas caso existam para evitar conflitos na migration
DROP POLICY IF EXISTS "Leitura publica de animais disponiveis" ON public.animais;
DROP POLICY IF EXISTS "Acesso total autenticado para animais" ON public.animais;
DROP POLICY IF EXISTS "Acesso total autenticado saude_animal" ON public.medical_records;

-- POLÍTICAS DA TABELA: animais
CREATE POLICY "Leitura publica de animais disponiveis"
  ON public.animais
  FOR SELECT
  TO anon
  USING (status_adocao = 'Disponível');

CREATE POLICY "Acesso total autenticado para animais"
  ON public.animais
  FOR ALL
  TO authenticated
  USING (public.check_user_access('animais'))
  WITH CHECK (public.check_user_access('animais'));

-- POLÍTICAS DA TABELA: medical_records (LGPD)
-- Público (anon) não tem política, logo é 100% bloqueado por padrão.
CREATE POLICY "Acesso total autenticado saude_animal"
  ON public.medical_records
  FOR ALL
  TO authenticated
  USING (public.check_user_access('saude_animal'))
  WITH CHECK (public.check_user_access('saude_animal'));