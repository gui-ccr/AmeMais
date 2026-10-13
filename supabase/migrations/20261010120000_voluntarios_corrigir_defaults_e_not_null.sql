-- ==============================================================================
-- Voluntários: correções da 20261006183000 (KAN-74)
-- ==============================================================================
--   * usuario_id herdou o default gen_random_uuid() da antiga coluna id. Com
--     ele, cadastrar um voluntário sem login gerava um usuario_id aleatório e a
--     foreign key para `usuarios` recusava o cadastro.
--   * status, tipo, areas_de_ajuda e created_at têm valor padrão, mas
--     aceitavam null.
--
-- Já aplicada no banco do projeto (10/10, pelo SQL Editor). IDEMPOTENTE.
-- ==============================================================================

ALTER TABLE public.voluntarios ALTER COLUMN usuario_id DROP DEFAULT;

UPDATE public.voluntarios SET status         = 'ativo'       WHERE status         IS NULL;
UPDATE public.voluntarios SET tipo           = 'apoio_geral' WHERE tipo           IS NULL;
UPDATE public.voluntarios SET areas_de_ajuda = '{}'          WHERE areas_de_ajuda IS NULL;
UPDATE public.voluntarios SET created_at     = now()         WHERE created_at     IS NULL;

ALTER TABLE public.voluntarios
    ALTER COLUMN status         SET NOT NULL,
    ALTER COLUMN tipo           SET NOT NULL,
    ALTER COLUMN areas_de_ajuda SET NOT NULL,
    ALTER COLUMN created_at     SET NOT NULL;
