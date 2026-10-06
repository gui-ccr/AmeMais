-- Adiciona as colunas necessárias para a API de Lares Temporários,
-- ignorando caso já existam (idempotência).
ALTER TABLE lares_temporarios
  ADD COLUMN IF NOT EXISTS nome_responsavel text,
  ADD COLUMN IF NOT EXISTS contato text,
  ADD COLUMN IF NOT EXISTS capacidade integer,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'disponivel',
  ADD COLUMN IF NOT EXISTS endereco_regiao text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();