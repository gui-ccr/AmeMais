-- Garante que não existem lares com capacidade inválida (0 ou negativa) antes da validação
UPDATE lares_temporarios 
SET capacidade = 1 
WHERE capacidade <= 0 OR capacidade IS NULL;

-- Ativa a validação retroativa e estrita da constraint já existente
ALTER TABLE lares_temporarios 
VALIDATE CONSTRAINT lares_temporarios_capacidade_check;