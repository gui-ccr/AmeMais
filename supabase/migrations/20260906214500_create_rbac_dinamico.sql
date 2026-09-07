-- 1. Criação da tabela de Módulos (As "portas" do sistema)
CREATE TABLE IF NOT EXISTS public.modulos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    slug TEXT NOT NULL
);

-- 2. Criação da tabela de Departamentos (Os "grupos/cargos" da ONG)
CREATE TABLE IF NOT EXISTS public.departamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL, 
    descricao TEXT
);

-- 3. Tabela Pivô: Departamento <-> Módulos 
CREATE TABLE IF NOT EXISTS public.departamento_modulos (
    departamento_id UUID NOT NULL REFERENCES public.departamentos(id) ON DELETE CASCADE,
    modulo_id UUID NOT NULL REFERENCES public.modulos(id) ON DELETE CASCADE,
    nivel_acesso TEXT NOT NULL CHECK (nivel_acesso IN ('total', 'leitura')),
    PRIMARY KEY (departamento_id, modulo_id)
);

-- 4. Tabela Pivô: Usuários <-> Departamentos
CREATE TABLE IF NOT EXISTS public.usuario_departamentos (
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    departamento_id UUID NOT NULL REFERENCES public.departamentos(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, departamento_id)
);

-- 5. CARGA INICIAL: Inserindo Módulos (Usando método seguro sem UNIQUE)
WITH novos_modulos (nome, slug) AS (
    VALUES 
    ('Painel Financeiro', 'financeiro'),
    ('Gestão de Animais e Prontuários', 'operacional'),
    ('Administração Geral', 'admin')
)
INSERT INTO public.modulos (nome, slug)
SELECT n.nome, n.slug
FROM novos_modulos n
WHERE NOT EXISTS (SELECT 1 FROM public.modulos m WHERE m.slug = n.slug);

-- 6. CARGA INICIAL: Inserindo Departamentos (Usando método seguro sem UNIQUE)
WITH novos_departamentos (nome, descricao) AS (
    VALUES 
    ('Presidência', 'Presidente da ONG'),
    ('Vice-Presidência', 'Vice-Presidente da ONG'),
    ('Contabilidade', 'Contador - Acesso às finanças'),
    ('Secretaria', 'Secretário(a) - Acesso administrativo'),
    ('Marketing', 'Gestão de redes sociais e portal público'),
    ('Voluntariado', 'Voluntários em geral da operação')
)
INSERT INTO public.departamentos (nome, descricao)
SELECT n.nome, n.descricao
FROM novos_departamentos n
WHERE NOT EXISTS (SELECT 1 FROM public.departamentos d WHERE d.nome = n.nome);

-- 7. Remoção do campo 'cargo' antigo da tabela usuarios
ALTER TABLE public.usuarios 
DROP COLUMN IF EXISTS cargo;