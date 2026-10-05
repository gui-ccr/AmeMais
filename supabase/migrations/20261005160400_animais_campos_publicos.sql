-- ==============================================================================
-- Animais: porte, faixa etária e descrição para o mural público (KAN-107)
-- ==============================================================================
-- O site público filtra por espécie, porte (P/M/G) e faixa etária
-- (filhote/adulto/idoso) e mostra uma descrição. A tabela só tinha nome,
-- espécie, raça, status, foto e os dados do adotante.
--
--   * porte        P | M | G
--   * faixa_etaria filhote | adulto | idoso   (a ONG quase nunca sabe a data de
--                  nascimento; faixa é o que ela consegue informar)
--   * idade_texto  texto livre opcional para o cartão (ex.: "2 anos")
--   * descricao    texto do cartão, até 500 caracteres
--
-- Animais que já existem recebem porte 'M' e faixa 'adulto' (valor neutro, para
-- não ficarem inválidos). A equipe deve REVISAR esses dados no painel: eles
-- aparecem no site público.
--
-- O `anon` só enxerga colunas listadas em GRANT (ver 20261005160100); aqui as
-- quatro colunas novas entram nessa lista. Nada do adotante é liberado.
--
-- IDEMPOTENTE.
-- ==============================================================================

ALTER TABLE public.animais
    ADD COLUMN IF NOT EXISTS porte        text NOT NULL DEFAULT 'M',
    ADD COLUMN IF NOT EXISTS faixa_etaria text NOT NULL DEFAULT 'adulto',
    ADD COLUMN IF NOT EXISTS idade_texto  text,
    ADD COLUMN IF NOT EXISTS descricao    text;

ALTER TABLE public.animais DROP CONSTRAINT IF EXISTS animais_porte_check;
ALTER TABLE public.animais
    ADD CONSTRAINT animais_porte_check CHECK (porte IN ('P', 'M', 'G'));

ALTER TABLE public.animais DROP CONSTRAINT IF EXISTS animais_faixa_etaria_check;
ALTER TABLE public.animais
    ADD CONSTRAINT animais_faixa_etaria_check CHECK (faixa_etaria IN ('filhote', 'adulto', 'idoso'));

ALTER TABLE public.animais DROP CONSTRAINT IF EXISTS animais_idade_texto_check;
ALTER TABLE public.animais
    ADD CONSTRAINT animais_idade_texto_check CHECK (idade_texto IS NULL OR char_length(idade_texto) <= 40);

ALTER TABLE public.animais DROP CONSTRAINT IF EXISTS animais_descricao_check;
ALTER TABLE public.animais
    ADD CONSTRAINT animais_descricao_check CHECK (descricao IS NULL OR char_length(descricao) <= 500);

COMMENT ON COLUMN public.animais.porte        IS 'Porte do animal: P, M ou G. Aparece no site público.';
COMMENT ON COLUMN public.animais.faixa_etaria IS 'filhote | adulto | idoso. Aparece no site público.';
COMMENT ON COLUMN public.animais.idade_texto  IS 'Idade em texto livre para o cartão (ex.: "2 anos"). Opcional.';
COMMENT ON COLUMN public.animais.descricao    IS 'Descrição do animal para o site público (até 500 caracteres).';

-- O anon passa a ler também estas colunas (e continua sem ler adotante_*,
-- adotante_id, lar_temporario_id e data_adocao).
GRANT SELECT (porte, faixa_etaria, idade_texto, descricao) ON public.animais TO anon;
