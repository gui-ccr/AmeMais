-- ==============================================================================
-- Pontos de coleta: horário, ativo e leitura pública (KAN-108)
-- ==============================================================================
-- O site mostra os pontos de coleta com nome, endereço e horário. A tabela só
-- tinha id, nome e endereço, e (depois da auditoria KAN-101) ninguém além da
-- service role conseguia ler: RLS ligado e nenhuma policy.
--
--   * horario  texto livre (ex.: "seg a sáb, 8h–18h")
--   * ativo    só pontos ativos aparecem no site
--
-- Leitura pública: apenas pontos `ativo = true`, e apenas as colunas listadas
-- no GRANT. Escrita: módulo `campanhas` (o mesmo de eventos), nível 'total'
-- para criar, editar e apagar, como nas outras tabelas.
--
-- DECISÃO A CONFIRMAR: o módulo `campanhas` foi escolhido por ser o das ações de
-- arrecadação (eventos). Se a ONG preferir outro módulo (ex.: `operacional`),
-- troque nas quatro policies abaixo.
--
-- Esta migration NÃO insere pontos de coleta: os três de
-- apps/web-public/src/features/donations/data/collection-points.ts parecem
-- dados de exemplo, e esta tabela alimenta o site público.
--
-- IDEMPOTENTE.
-- ==============================================================================

ALTER TABLE public.pontos_coleta
    ADD COLUMN IF NOT EXISTS horario text,
    ADD COLUMN IF NOT EXISTS ativo   boolean NOT NULL DEFAULT true;

ALTER TABLE public.pontos_coleta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura publica de pontos de coleta ativos" ON public.pontos_coleta;
DROP POLICY IF EXISTS "Leitura autenticada de pontos de coleta"    ON public.pontos_coleta;
DROP POLICY IF EXISTS "Criacao autenticada de pontos de coleta"    ON public.pontos_coleta;
DROP POLICY IF EXISTS "Atualizacao autenticada de pontos de coleta" ON public.pontos_coleta;
DROP POLICY IF EXISTS "Exclusao autenticada de pontos de coleta"   ON public.pontos_coleta;

CREATE POLICY "Leitura publica de pontos de coleta ativos"
    ON public.pontos_coleta
    FOR SELECT
    TO anon
    USING (ativo = true);

CREATE POLICY "Leitura autenticada de pontos de coleta"
    ON public.pontos_coleta
    FOR SELECT
    TO authenticated
    USING (public.check_user_access('campanhas'));

CREATE POLICY "Criacao autenticada de pontos de coleta"
    ON public.pontos_coleta
    FOR INSERT
    TO authenticated
    WITH CHECK (public.check_user_access('campanhas', 'total'));

CREATE POLICY "Atualizacao autenticada de pontos de coleta"
    ON public.pontos_coleta
    FOR UPDATE
    TO authenticated
    USING (public.check_user_access('campanhas', 'total'))
    WITH CHECK (public.check_user_access('campanhas', 'total'));

CREATE POLICY "Exclusao autenticada de pontos de coleta"
    ON public.pontos_coleta
    FOR DELETE
    TO authenticated
    USING (public.check_user_access('campanhas', 'total'));

-- O anon lê só estas colunas (`ativo` entra porque a policy depende dela).
GRANT SELECT (id, nome, endereco, horario, ativo) ON public.pontos_coleta TO anon;
