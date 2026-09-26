-- 1. Adição dos campos com o retrato do adotante informado diretamente no
-- cadastro de um animal já adotado (ex.: adoções feitas fora do sistema).
-- Não substitui `adotante_id` (FK para uma conta em public.adotantes) — são
-- dois dados diferentes, os dois convivem na tabela.
ALTER TABLE public.animais
ADD COLUMN adotante_nome TEXT,
ADD COLUMN adotante_idade INTEGER,
ADD COLUMN adotante_cep TEXT,
ADD COLUMN adotante_localidade TEXT;
