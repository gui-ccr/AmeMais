-- ==============================================================================
-- Lares temporários: valida a regra capacidade > 0 nas linhas antigas (KAN-72)
-- ==============================================================================
-- A migration 20261005160000 criou lares_temporarios_capacidade_check como
-- NOT VALID (só vale para linhas novas ou editadas). Aqui ela passa a valer
-- para todas.
--
-- Se existir lar com capacidade 0 ou negativa, a migration PARA e lista os ids,
-- em vez de inventar uma capacidade: quem sabe quantos animais o lar comporta é
-- a equipe. Corrija pelo painel e rode de novo.
--
-- IDEMPOTENTE (VALIDATE em constraint já validada não faz nada).
-- ==============================================================================

DO $$
DECLARE
    v_invalidos text;
BEGIN
    SELECT string_agg(id::text, ', ')
    INTO v_invalidos
    FROM public.lares_temporarios
    WHERE capacidade IS NULL OR capacidade <= 0;

    IF v_invalidos IS NOT NULL THEN
        RAISE EXCEPTION 'Lares com capacidade inválida (0, negativa ou vazia): %. Corrija a capacidade antes de rodar esta migration.', v_invalidos;
    END IF;
END $$;

ALTER TABLE public.lares_temporarios
    VALIDATE CONSTRAINT lares_temporarios_capacidade_check;
