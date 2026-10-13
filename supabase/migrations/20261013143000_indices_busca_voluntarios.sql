-- Índices para otimizar a listagem e os filtros exatos
CREATE INDEX IF NOT EXISTS voluntarios_status_idx ON public.voluntarios (status);
CREATE INDEX IF NOT EXISTS voluntarios_tipo_idx ON public.voluntarios (tipo);
CREATE INDEX IF NOT EXISTS voluntarios_nome_idx ON public.voluntarios (nome);

-- Índice GIN para busca de alta performance em campos do tipo ARRAY
CREATE INDEX IF NOT EXISTS voluntarios_areas_idx ON public.voluntarios USING GIN (areas_de_ajuda);