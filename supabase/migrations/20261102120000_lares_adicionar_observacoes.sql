-- Observações livres do lar (ex.: "tem quintal", "não aceita filhotes"). Opcional; idempotente.
ALTER TABLE public.lares_temporarios ADD COLUMN IF NOT EXISTS observacoes text;
