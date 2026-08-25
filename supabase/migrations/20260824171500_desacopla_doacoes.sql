-- 1. Remoção de qualquer vínculo de usuários na tabela de doações
ALTER TABLE public.doacoes
DROP COLUMN IF EXISTS usuario_id,
DROP COLUMN IF EXISTS doador_id;

-- 2. Adição dos campos de texto simples para registrar o doador passivamente
ALTER TABLE public.doacoes
ADD COLUMN nome_doador TEXT,
ADD COLUMN telefone_doador TEXT,
ADD COLUMN cpf_doador TEXT;

-- Nota sobre Voluntários:
-- A tabela public.voluntarios não recebe ALTER TABLE aqui pois foi 
-- confirmado no schema atual que ela já possui a restrição FOREIGN KEY 
-- (usuario_id) apontando corretamente para public.usuarios, 
-- atendendo ao critério do Tech Lead.