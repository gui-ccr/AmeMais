-- 1. Criação da tabela de Prontuários Médicos (medical_records)
CREATE TABLE public.medical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_id UUID NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL, -- Ex: 'Vacina', 'Cirurgia', 'Consulta'
    descricao TEXT NOT NULL,
    data_atendimento DATE NOT NULL,
    veterinario_responsavel TEXT, -- Opcional
    anexo_url TEXT, -- Opcional (Link para o PDF da receita/exame)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ativação da Segurança em Nível de Linha (Tranca a tabela)
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Nota: Como o critério exige bloqueio de acesso público, NÃO foi criado 
-- nenhuma política para a role "anon". O RLS bloqueia por padrão.

-- 3. Política para os usuários autenticados (Colaboradores e Admin)
CREATE POLICY "Permitir acesso total aos prontuarios para usuarios autenticados" 
ON public.medical_records 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 4. Política para o Backend (Service Role Key)
CREATE POLICY "Permitir acesso total aos prontuarios para o backend" 
ON public.medical_records 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);