-- 1. Cria a View para contabilizar a ocupação e as vagas
CREATE OR REPLACE VIEW lares_com_ocupacao WITH (security_invoker = true) AS
SELECT
    l.id,
    l.capacidade,
    COUNT(a.id)::integer AS ocupacao,
    (l.capacidade - COUNT(a.id))::integer AS vagas
FROM lares_temporarios l
LEFT JOIN animais a ON a.lar_temporario_id = l.id
GROUP BY l.id, l.capacidade;

-- 2. Cria a função que verifica a capacidade
CREATE OR REPLACE FUNCTION check_capacidade_lar()
RETURNS TRIGGER AS $$
DECLARE
    v_capacidade integer;
    v_ocupacao integer;
BEGIN
    -- Se não estiver a vincular a um lar (lar_temporario_id nulo), deixa passar
    IF NEW.lar_temporario_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Vai buscar a capacidade do lar selecionado
    SELECT capacidade INTO v_capacidade 
    FROM lares_temporarios 
    WHERE id = NEW.lar_temporario_id;

    -- Conta quantos animais já estão atualmente nesse lar
    SELECT COUNT(*) INTO v_ocupacao 
    FROM animais 
    WHERE lar_temporario_id = NEW.lar_temporario_id;

    -- Se já não há vagas, levanta o erro com mensagem clara
    IF v_ocupacao >= v_capacidade THEN
        RAISE EXCEPTION 'Capacidade esgotada: O lar temporário atingiu o limite máximo de % animais.', v_capacidade;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Associa o Trigger à tabela animais
DROP TRIGGER IF EXISTS tr_controla_capacidade_lar ON animais;
CREATE TRIGGER tr_controla_capacidade_lar
BEFORE INSERT OR UPDATE OF lar_temporario_id
ON animais
FOR EACH ROW
EXECUTE FUNCTION check_capacidade_lar();