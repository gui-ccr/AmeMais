-- 1. Ativa a segurança na tabela (tranca a porta)
ALTER TABLE public.animais ENABLE ROW LEVEL SECURITY;

-- 2. Política de Leitura Pública (Visitantes do site)
CREATE POLICY "Permitir leitura publica apenas de animais disponiveis" 
ON public.animais 
FOR SELECT 
TO anon 
USING (status_adocao = 'Disponível');

-- 3. Política de Leitura para Logados (Colaboradores/Admin)
CREATE POLICY "Permitir leitura total para usuarios logados" 
ON public.animais 
FOR SELECT 
TO authenticated 
USING (true);

-- 4. Política de Escrita para o Backend (Service Role Key)
CREATE POLICY "Permitir escrita (INSERT/UPDATE/DELETE) apenas pelo backend" 
ON public.animais 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);