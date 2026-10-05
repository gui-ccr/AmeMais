-- ==============================================================================
-- KAN-101 — Confere se o banco real tem o que as migrations dizem ter criado.
-- Somente leitura. É UMA consulta só (o SQL Editor mostra só a última).
--
-- Motivo: supabase_migrations.schema_migrations lista todas as migrations como
-- aplicadas, mas o banco real não bate (policy de lares_temporarios e bucket de
-- fotos ausentes). O histórico não é confiável; o banco é a fonte da verdade.
--
-- Leia o resultado: linhas com ok = false são o que FALTA no banco.
-- ==============================================================================
SELECT item, ok
FROM (
  -- animais: colunas (20260825/20260925211000)
  SELECT 'animais: coluna ' || x.nome AS item,
         EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'animais'
                    AND column_name = x.nome) AS ok
  FROM unnest(ARRAY['adotante_nome', 'adotante_idade', 'adotante_cep', 'adotante_localidade',
                    'lar_temporario_id', 'url_foto']) AS x(nome)

  UNION ALL
  -- animais: constraints (20260925211000 e as duas migrations de 27/09)
  SELECT 'animais: constraint ' || x.nome,
         EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'public.animais'::regclass AND conname = x.nome)
  FROM unnest(ARRAY['animais_status_adocao_check', 'animais_especie_check',
                    'animais_adotante_idade_check', 'animais_adotante_cep_check',
                    'animais_dados_adotante_status_check']) AS x(nome)

  UNION ALL
  -- urgency_items: colunas (20260925210000)
  SELECT 'urgency_items: coluna ' || x.nome,
         EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'urgency_items'
                    AND column_name = x.nome)
  FROM unnest(ARRAY['prioridade', 'tipo', 'unidade', 'data_limite', 'is_active']) AS x(nome)

  UNION ALL
  -- lares_temporarios: colunas que a API lê (20260913122423)
  SELECT 'lares_temporarios: coluna ' || x.nome,
         EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'lares_temporarios'
                    AND column_name = x.nome)
  FROM unnest(ARRAY['nome_responsavel', 'contato', 'capacidade', 'status',
                    'endereco_regiao', 'is_active', 'created_at']) AS x(nome)

  UNION ALL
  SELECT 'lares_temporarios: policy "Acesso total autenticado lares"',
         EXISTS (SELECT 1 FROM pg_policies
                  WHERE schemaname = 'public' AND tablename = 'lares_temporarios'
                    AND policyname = 'Acesso total autenticado lares')

  UNION ALL
  -- Fotos (20260925211000)
  SELECT 'storage: bucket animal-photos',
         EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'animal-photos')

  UNION ALL
  SELECT 'storage: policy "Upload de fotos de animais"',
         EXISTS (SELECT 1 FROM pg_policies
                  WHERE schemaname = 'storage' AND tablename = 'objects'
                    AND policyname = 'Upload de fotos de animais')

  UNION ALL
  -- RBAC: módulos usados pelas policies
  SELECT 'modulos: slug ' || x.nome,
         EXISTS (SELECT 1 FROM public.modulos WHERE slug = x.nome)
  FROM unnest(ARRAY['lares', 'urgencias', 'campanhas', 'operacional']) AS x(nome)

  UNION ALL
  SELECT 'funcao public.check_user_access',
         EXISTS (SELECT 1 FROM pg_proc p
                   JOIN pg_namespace n ON n.oid = p.pronamespace
                  WHERE n.nspname = 'public' AND p.proname = 'check_user_access')
) t
ORDER BY ok, item;
