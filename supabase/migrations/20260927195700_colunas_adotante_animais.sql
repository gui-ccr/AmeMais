-- 1. Adiciona as novas colunas
ALTER TABLE animais
  ADD COLUMN adotante_nome text,
  ADD COLUMN adotante_idade smallint,
  ADD COLUMN adotante_cep text,
  ADD COLUMN adotante_localidade text;

-- 2. Adiciona as travas de validação (CHECK)
ALTER TABLE animais
  ADD CONSTRAINT animais_adotante_idade_check 
    CHECK (adotante_idade >= 1 AND adotante_idade <= 120),
  
  ADD CONSTRAINT animais_adotante_cep_check 
    CHECK (adotante_cep ~ '^[0-9]{8}$'),
  
  ADD CONSTRAINT animais_dados_adotante_status_check 
    CHECK (
      status_adocao = 'adotado' OR 
      (adotante_nome IS NULL AND adotante_idade IS NULL AND adotante_cep IS NULL AND adotante_localidade IS NULL)
    );