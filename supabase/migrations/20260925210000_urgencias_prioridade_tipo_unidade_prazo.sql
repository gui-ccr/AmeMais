-- ==============================================================================
-- Urgências: prioridade, tipo de doação, unidade da meta e data limite
-- ==============================================================================
-- Até aqui `urgency_items` só sabia titulo/descricao/meta/arrecadado/is_active.
-- O admin passou a cadastrar também:
--   * prioridade  -> urgente | importante | continua   (ordena o mural)
--   * tipo        -> o que está sendo pedido (ração, medicamento, cirurgia...)
--   * unidade     -> em que a meta é medida (kg, un, L ou R$)
--   * data_limite -> prazo opcional
--
-- `meta_arrecadacao` e `valor_arrecadado` continuam sendo as colunas da meta e
-- do arrecadado; o que muda é que agora eles são medidos na `unidade`.
--
-- As linhas que já existem foram cadastradas quando a meta era sempre em
-- dinheiro, por isso `unidade` nasce como 'R$' para elas. Os demais defaults
-- ('importante' / 'outros') são o valor mais neutro para dado antigo.
--
-- Idempotente: pode rodar mais de uma vez sem erro.
-- As policies de RLS de urgency_items (leitura pública só de is_active,
-- escrita via check_user_access) valem para as colunas novas sem alteração.
-- ==============================================================================

ALTER TABLE public.urgency_items
    ADD COLUMN IF NOT EXISTS prioridade  TEXT NOT NULL DEFAULT 'importante',
    ADD COLUMN IF NOT EXISTS tipo        TEXT NOT NULL DEFAULT 'outros',
    ADD COLUMN IF NOT EXISTS unidade     TEXT NOT NULL DEFAULT 'R$',
    ADD COLUMN IF NOT EXISTS data_limite DATE;

ALTER TABLE public.urgency_items DROP CONSTRAINT IF EXISTS urgency_items_prioridade_check;
ALTER TABLE public.urgency_items
    ADD CONSTRAINT urgency_items_prioridade_check
    CHECK (prioridade IN ('urgente', 'importante', 'continua'));

ALTER TABLE public.urgency_items DROP CONSTRAINT IF EXISTS urgency_items_tipo_check;
ALTER TABLE public.urgency_items
    ADD CONSTRAINT urgency_items_tipo_check
    CHECK (tipo IN ('racao', 'medicamento', 'consulta', 'cirurgia', 'higiene', 'cobertores', 'outros'));

ALTER TABLE public.urgency_items DROP CONSTRAINT IF EXISTS urgency_items_unidade_check;
ALTER TABLE public.urgency_items
    ADD CONSTRAINT urgency_items_unidade_check
    CHECK (unidade IN ('kg', 'un', 'L', 'R$'));

COMMENT ON COLUMN public.urgency_items.prioridade  IS 'urgente | importante | continua — define a ordem no mural.';
COMMENT ON COLUMN public.urgency_items.tipo        IS 'Categoria da doação pedida (racao, medicamento, consulta, cirurgia, higiene, cobertores, outros).';
COMMENT ON COLUMN public.urgency_items.unidade     IS 'Unidade em que meta_arrecadacao e valor_arrecadado são medidos: kg, un, L ou R$.';
COMMENT ON COLUMN public.urgency_items.data_limite IS 'Prazo opcional da urgência (dia, sem hora).';
