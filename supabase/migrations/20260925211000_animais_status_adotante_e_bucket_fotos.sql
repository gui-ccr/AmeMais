-- ==============================================================================
-- Animais: status padronizado, dados do adotante e bucket de fotos
-- ==============================================================================
-- Resolve três descompassos entre o banco e o que a API/tela de Animais fazem:
--
-- 1. STATUS. O banco guardava 'Disponível' (maiúscula + acento) e a API usa
--    'disponivel'. Um animal criado direto no banco quebrava a API
--    (AnimalStatus.from lança erro) e um animal criado pela API nunca aparecia
--    no site público (a policy só olhava 'Disponível').
-- 2. ADOTANTE. O cadastro de animal já adotado guarda nome, idade, CEP e
--    localidade de quem adotou — pessoa de fora, sem login, então não cabe em
--    `adotantes` (que é ligada a `usuarios`).
-- 3. FOTOS. O código sobe fotos para o bucket `animal-photos`, que nenhuma
--    migration criava.
--
-- Idempotente (pode rodar mais de uma vez). Roda numa transação: se algum
-- animal tiver um status desconhecido, a migration falha inteira e nada é
-- alterado — é o comportamento desejado, melhor do que "adivinhar" o status.
-- ==============================================================================


-- ------------------------------------------------------------------------------
-- 1. STATUS: 'Disponível' -> 'disponivel' (e demais valores do padrão da API)
-- ------------------------------------------------------------------------------

UPDATE public.animais
SET status_adocao = CASE
    WHEN status_adocao IS NULL                                 THEN 'disponivel'
    WHEN status_adocao IN ('Disponível', 'Disponivel')         THEN 'disponivel'
    WHEN status_adocao IN ('Adotado')                          THEN 'adotado'
    WHEN status_adocao IN ('Em Tratamento', 'Em tratamento')   THEN 'em_tratamento'
    WHEN status_adocao IN ('Temporário', 'Em Lar Temporário', 'Em lar temporário') THEN 'em_lar_temporario'
    ELSE status_adocao
END;

ALTER TABLE public.animais ALTER COLUMN status_adocao SET DEFAULT 'disponivel';
ALTER TABLE public.animais ALTER COLUMN status_adocao SET NOT NULL;

ALTER TABLE public.animais DROP CONSTRAINT IF EXISTS animais_status_adocao_check;
ALTER TABLE public.animais
    ADD CONSTRAINT animais_status_adocao_check
    CHECK (status_adocao IN ('disponivel', 'em_tratamento', 'em_lar_temporario', 'adotado'));

-- Espécie: o formulário oferece Cachorro, Gato e Outro; o CHECK antigo só
-- aceitava os dois primeiros.
ALTER TABLE public.animais DROP CONSTRAINT IF EXISTS animais_especie_check;
ALTER TABLE public.animais
    ADD CONSTRAINT animais_especie_check
    CHECK (especie IS NULL OR especie IN ('Cachorro', 'Gato', 'Outro'));


-- ------------------------------------------------------------------------------
-- 2. ADOTANTE (dados de quem adotou) em `animais`
-- ------------------------------------------------------------------------------

ALTER TABLE public.animais
    ADD COLUMN IF NOT EXISTS adotante_nome       TEXT,
    ADD COLUMN IF NOT EXISTS adotante_idade      SMALLINT,
    ADD COLUMN IF NOT EXISTS adotante_cep        TEXT,
    ADD COLUMN IF NOT EXISTS adotante_localidade TEXT;

ALTER TABLE public.animais DROP CONSTRAINT IF EXISTS animais_adotante_idade_check;
ALTER TABLE public.animais
    ADD CONSTRAINT animais_adotante_idade_check
    CHECK (adotante_idade IS NULL OR adotante_idade BETWEEN 1 AND 120);

-- CEP guardado só com os 8 dígitos (a máscara 00000-000 é coisa da tela).
ALTER TABLE public.animais DROP CONSTRAINT IF EXISTS animais_adotante_cep_check;
ALTER TABLE public.animais
    ADD CONSTRAINT animais_adotante_cep_check
    CHECK (adotante_cep IS NULL OR adotante_cep ~ '^[0-9]{8}$');

-- Os 4 campos do adotante andam juntos: ou vêm todos, ou nenhum.
ALTER TABLE public.animais DROP CONSTRAINT IF EXISTS animais_adotante_completo_check;
ALTER TABLE public.animais
    ADD CONSTRAINT animais_adotante_completo_check
    CHECK (num_nonnulls(adotante_nome, adotante_idade, adotante_cep, adotante_localidade) IN (0, 4));

-- PRIVACIDADE: nome/idade/CEP de quem adotou só podem existir enquanto o animal
-- está `adotado`. A policy pública deixa o site ler animais 'disponivel'; se um
-- animal devolvido (adotado -> disponivel) mantivesse esses dados, eles ficariam
-- legíveis por qualquer visitante. A API zera esses campos ao mudar o status, e
-- este CHECK garante isso no banco mesmo para quem escrever direto.
-- NOT VALID: não reprova linhas antigas (ex.: `data_adocao` preenchida em animal
-- que não está adotado); só vale para inserts/updates daqui para frente.
ALTER TABLE public.animais DROP CONSTRAINT IF EXISTS animais_dados_adocao_somente_adotado_check;
ALTER TABLE public.animais
    ADD CONSTRAINT animais_dados_adocao_somente_adotado_check
    CHECK (
        status_adocao = 'adotado'
        OR (
            num_nonnulls(adotante_nome, adotante_idade, adotante_cep, adotante_localidade) = 0
            AND data_adocao IS NULL
        )
    ) NOT VALID;

COMMENT ON COLUMN public.animais.adotante_nome       IS 'Nome de quem adotou (pessoa de fora, sem login). Só existe com status adotado.';
COMMENT ON COLUMN public.animais.adotante_idade      IS 'Idade de quem adotou (1 a 120).';
COMMENT ON COLUMN public.animais.adotante_cep        IS 'CEP de quem adotou, só dígitos.';
COMMENT ON COLUMN public.animais.adotante_localidade IS 'Cidade/bairro de quem adotou, ex.: "Teófilo Otoni - MG".';


-- ------------------------------------------------------------------------------
-- 3. RLS de leitura pública: agora com o status no padrão da API
-- ------------------------------------------------------------------------------
-- Remove as duas versões que já existiram (nomes diferentes em migrations
-- antigas) e recria uma só.

DROP POLICY IF EXISTS "Permitir leitura publica apenas de animais disponiveis" ON public.animais;
DROP POLICY IF EXISTS "Leitura publica de animais disponiveis" ON public.animais;

CREATE POLICY "Leitura publica de animais disponiveis"
    ON public.animais
    FOR SELECT
    TO anon
    USING (status_adocao = 'disponivel');


-- ------------------------------------------------------------------------------
-- 4. BUCKET DE FOTOS (Storage)
-- ------------------------------------------------------------------------------
-- Público para leitura: as fotos aparecem no site. Limite de 4 MB por arquivo
-- porque a Vercel corta requisições acima de ~4,5 MB.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'animal-photos',
    'animal-photos',
    true,
    4194304,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public             = EXCLUDED.public,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Quem envia fotos é a API, autenticada como o usuário (não como service role):
-- a mesma regra que permite CRIAR animal (módulo 'operacional', nível 'total')
-- é a que permite subir a foto. Ler não precisa de policy (bucket público).
DROP POLICY IF EXISTS "Upload de fotos de animais" ON storage.objects;

CREATE POLICY "Upload de fotos de animais"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'animal-photos'
        AND public.check_user_access('operacional', 'total')
    );
