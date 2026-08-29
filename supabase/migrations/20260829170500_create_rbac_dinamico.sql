-- 1. Criação da tabela de Módulos (As "portas" do sistema)
CREATE TABLE public.modulos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
);

-- 2. Criação da tabela de Departamentos (Os "grupos/cargos" da ONG)
CREATE TABLE public.departamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT
);

-- 3. Tabela Pivô: Departamento <-> Módulos 
CREATE TABLE public.departamento_modulos (
    departamento_id UUID NOT NULL REFERENCES public.departamentos(id) ON DELETE CASCADE,
    modulo_id UUID NOT NULL REFERENCES public.modulos(id) ON DELETE CASCADE,
    nivel_acesso TEXT NOT NULL CHECK (nivel_acesso IN ('total', 'leitura')),
    PRIMARY KEY (departamento_id, modulo_id)
);

-- 4. Tabela Pivô: Usuários <-> Departamentos (Suporta a Secretária que também é Voluntária)
CREATE TABLE public.usuario_departamentos (
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    departamento_id UUID NOT NULL REFERENCES public.departamentos(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, departamento_id)
);

-- 5. CARGA INICIAL (Seed): Inserindo os Módulos Básicos do Sistema
INSERT INTO public.modulos (nome, slug) VALUES
    ('Painel Financeiro', 'financeiro'),
    ('Gestão de Animais e Prontuários', 'operacional'),
    ('Administração Geral', 'admin');

-- 6. CARGA INICIAL (Seed): Inserindo os Cargos/Departamentos mapeados
INSERT INTO public.departamentos (nome, descricao) VALUES
    ('Presidência', 'Presidente da ONG'),
    ('Vice-Presidência', 'Vice-Presidente da ONG'),
    ('Contabilidade', 'Contador - Acesso às finanças'),
    ('Secretaria', 'Secretário(a) - Acesso administrativo'),
    ('Marketing', 'Gestão de redes sociais e portal público'),
    ('Voluntariado', 'Voluntários em geral da operação');

-- 7. Remoção do campo 'cargo' antigo da tabela usuarios
ALTER TABLE public.usuarios 
DROP COLUMN IF EXISTS cargo;