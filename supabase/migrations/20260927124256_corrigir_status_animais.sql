-- 1. Converte os valores legados para o padrão da API
UPDATE animais SET status_adocao = 'disponivel' WHERE status_adocao = 'Disponível';
UPDATE animais SET status_adocao = 'adotado' WHERE status_adocao = 'Adotado';
UPDATE animais SET status_adocao = 'em_tratamento' WHERE status_adocao = 'Em Tratamento';
UPDATE animais SET status_adocao = 'em_lar_temporario' WHERE status_adocao = 'Temporário';

-- 2. Troca o valor padrão (DEFAULT) da coluna
ALTER TABLE animais ALTER COLUMN status_adocao SET DEFAULT 'disponivel';

-- 3. Adiciona a trava (CHECK) exigindo apenas as 4 opções exatas da API
ALTER TABLE animais ADD CONSTRAINT animais_status_adocao_check 
CHECK (status_adocao IN ('disponivel', 'adotado', 'em_tratamento', 'em_lar_temporario'));

-- 4. Atualiza a política de leitura pública para o front-end
DROP POLICY IF EXISTS "Leitura publica de animais disponiveis" ON animais;

CREATE POLICY "Leitura publica de animais disponiveis" 
ON animais 
FOR SELECT 
TO anon 
USING (status_adocao = 'disponivel');