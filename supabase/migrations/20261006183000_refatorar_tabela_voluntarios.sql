-- ==============================================================================
-- Voluntários: cadastro sem login (KAN-74)
-- ==============================================================================
-- Aplicada no banco do projeto em 06/10 (registrada como 20261006183000) e
-- versionada aqui depois. No banco do projeto a tabela antiga tinha `id` (com o
-- id do usuário), `nome` e `created_at`, e estava vazia.
--
-- Diferenças para a versão aplicada:
--   * o passo 1 cobre também um banco novo, onde a tabela vem do schema do
--     repositório (usuario_id como chave, sem id, nome e created_at);
--   * a regra antiga de `tipo` sai antes da conversão dos valores (com dados
--     na tabela, a versão aplicada falhava no CHECK antigo).
--
-- ATENÇÃO: o DROP ... CASCADE do passo 1 remove a foreign key
-- lares_temporarios.voluntario_id -> voluntarios (ela apontava para a chave
-- antiga). A coluna voluntario_id continua existindo, sem a ligação.
--
-- As correções (usuario_id sem default e colunas NOT NULL) estão em
-- 20261010120000_voluntarios_corrigir_defaults_e_not_null.sql.
--
-- IDEMPOTENTE.
-- ==============================================================================

-- 1. Ajuste da Chave Primária e vínculo de Usuário
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'voluntarios' AND column_name = 'usuario_id') THEN
    -- Banco do projeto: a coluna 'id' antiga guardava a referência do usuário
    ALTER TABLE public.voluntarios DROP CONSTRAINT IF EXISTS voluntarios_pkey CASCADE;
    ALTER TABLE public.voluntarios RENAME COLUMN id TO usuario_id;
    ALTER TABLE public.voluntarios ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'voluntarios' AND column_name = 'id') THEN
    -- Banco novo: usuario_id é a chave e não existe 'id'
    ALTER TABLE public.voluntarios DROP CONSTRAINT IF EXISTS voluntarios_pkey CASCADE;
    ALTER TABLE public.voluntarios ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
  END IF;
END $$;

-- 2. Adicionar as novas colunas que faltavam
-- (nome e created_at só faltam num banco novo)
ALTER TABLE public.voluntarios
  ADD COLUMN IF NOT EXISTS nome TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS areas_de_ajuda TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';

-- 3. Migração de dados existentes
-- A regra antiga só aceita 'Veterinário' e 'Apoio Geral': sai antes da conversão
-- (a nova é criada no passo 6).
ALTER TABLE public.voluntarios DROP CONSTRAINT IF EXISTS voluntarios_tipo_check;

UPDATE public.voluntarios SET tipo = 'veterinario' WHERE tipo = 'Veterinário';

UPDATE public.voluntarios SET tipo = 'apoio_geral' WHERE tipo = 'Apoio Geral';

-- Copiar email de 'usuarios' para 'voluntarios' vinculados
UPDATE public.voluntarios v
SET 
  nome = COALESCE(v.nome, u.nome),
  email = COALESCE(v.email, u.email)
FROM public.usuarios u
WHERE v.usuario_id = u.id AND (v.nome IS NULL OR v.email IS NULL);

-- Saneamento: Remover máscara de telefones
UPDATE public.voluntarios
SET telefone = REGEXP_REPLACE(telefone, '\D', '', 'g')
WHERE telefone IS NOT NULL;

-- Saneamento: Anular telefones com tamanho inválido
UPDATE public.voluntarios
SET telefone = NULL
WHERE telefone IS NOT NULL AND telefone !~ '^[0-9]{10,11}$';

UPDATE public.voluntarios SET nome = 'Voluntário Legado' WHERE nome IS NULL;

-- 4. Modificadores de Colunas
ALTER TABLE public.voluntarios ALTER COLUMN usuario_id DROP NOT NULL;

ALTER TABLE public.voluntarios ALTER COLUMN nome SET NOT NULL;

ALTER TABLE public.voluntarios ALTER COLUMN tipo SET DEFAULT 'apoio_geral';

-- 5. Ajustar a Foreign Key para ON DELETE SET NULL
ALTER TABLE public.voluntarios DROP CONSTRAINT IF EXISTS voluntarios_id_fkey;

ALTER TABLE public.voluntarios DROP CONSTRAINT IF EXISTS voluntarios_usuario_id_fkey;

ALTER TABLE public.voluntarios 
  ADD CONSTRAINT voluntarios_usuario_id_fkey 
  FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;

-- 6. Recriar Restrições (CHECKs)
ALTER TABLE public.voluntarios DROP CONSTRAINT IF EXISTS voluntarios_tipo_check;

ALTER TABLE public.voluntarios DROP CONSTRAINT IF EXISTS voluntarios_nome_check;

ALTER TABLE public.voluntarios DROP CONSTRAINT IF EXISTS voluntarios_telefone_check;

ALTER TABLE public.voluntarios DROP CONSTRAINT IF EXISTS voluntarios_status_check;

ALTER TABLE public.voluntarios DROP CONSTRAINT IF EXISTS voluntarios_areas_check;

ALTER TABLE public.voluntarios
  ADD CONSTRAINT voluntarios_tipo_check CHECK (tipo IN ('veterinario', 'apoio_geral')),
  ADD CONSTRAINT voluntarios_nome_check CHECK (char_length(trim(nome)) >= 2),
  ADD CONSTRAINT voluntarios_telefone_check CHECK (telefone IS NULL OR telefone ~ '^[0-9]{10,11}$'),
  ADD CONSTRAINT voluntarios_status_check CHECK (status IN ('ativo', 'inativo')),
  ADD CONSTRAINT voluntarios_areas_check CHECK (areas_de_ajuda <@ ARRAY['lar_temporario', 'transporte', 'eventos', 'divulgacao']::text[]);

-- 7. Índice único para e-mail
DROP INDEX IF EXISTS voluntarios_email_lower_idx;

CREATE UNIQUE INDEX voluntarios_email_lower_idx ON public.voluntarios (lower(email)) WHERE email IS NOT NULL;
