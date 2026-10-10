-- ==============================================================================
-- Lares temporários: ocupação e bloqueio de superlotação (KAN-73, KAN-95)
-- ==============================================================================
--   * View lares_com_ocupacao: capacidade, ocupação e vagas de cada lar.
--   * Trigger em animais: impede vincular um animal a um lar já cheio.
--
-- IDEMPOTENTE.
-- ==============================================================================

-- 1. View com ocupação e vagas.
-- security_invoker: quem consulta só enxerga os lares e animais que o RLS dele
-- permite (sem isso a view rodaria com os direitos do dono e furaria o RLS).
CREATE OR REPLACE VIEW public.lares_com_ocupacao WITH (security_invoker = true) AS
SELECT
    l.id,
    l.capacidade,
    COUNT(a.id)::integer                  AS ocupacao,
    (l.capacidade - COUNT(a.id))::integer AS vagas
FROM public.lares_temporarios l
LEFT JOIN public.animais a ON a.lar_temporario_id = l.id
GROUP BY l.id, l.capacidade;

REVOKE ALL ON public.lares_com_ocupacao FROM anon;
GRANT SELECT ON public.lares_com_ocupacao TO authenticated;

-- 2. Função que confere a capacidade.
-- SECURITY DEFINER: a contagem precisa enxergar TODOS os animais do lar, não só
-- os que o RLS de quem está salvando deixa ver (senão contaria a menos).
-- search_path fixo: obrigatório em função SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.check_capacidade_lar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_capacidade integer;
    v_ocupacao   integer;
BEGIN
    -- Animal sem lar: nada a conferir.
    IF NEW.lar_temporario_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Edição que não troca o lar (ex.: salvar o animal de novo com o mesmo
    -- lar): o animal já conta na ocupação, então não pode ser bloqueado.
    IF TG_OP = 'UPDATE' AND OLD.lar_temporario_id IS NOT DISTINCT FROM NEW.lar_temporario_id THEN
        RETURN NEW;
    END IF;

    -- FOR UPDATE trava a linha do lar até o fim da transação: dois cadastros
    -- ao mesmo tempo na última vaga ficam em fila, e o segundo é barrado.
    SELECT capacidade INTO v_capacidade
    FROM public.lares_temporarios
    WHERE id = NEW.lar_temporario_id
    FOR UPDATE;

    -- Lar inexistente: deixa a foreign key dar o erro.
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO v_ocupacao
    FROM public.animais
    WHERE lar_temporario_id = NEW.lar_temporario_id
      AND id <> NEW.id;

    IF v_ocupacao >= v_capacidade THEN
        RAISE EXCEPTION 'Capacidade esgotada: o lar temporário já está com o limite de % animal(is).', v_capacidade
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

-- 3. Liga o trigger na tabela animais.
DROP TRIGGER IF EXISTS tr_controla_capacidade_lar ON public.animais;
CREATE TRIGGER tr_controla_capacidade_lar
    BEFORE INSERT OR UPDATE OF lar_temporario_id
    ON public.animais
    FOR EACH ROW
    EXECUTE FUNCTION public.check_capacidade_lar();
