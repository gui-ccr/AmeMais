-- ==========================================
-- SEED: VOLUNTÁRIOS DE TESTE (KAN-97)
-- ==========================================

-- Inserir 12 voluntários com dados variados garantindo que não duplique
INSERT INTO public.voluntarios (id, nome, email, telefone, bairro, tipo, status, areas_de_ajuda) VALUES
('d0000000-0000-0000-0000-000000000001', 'Ana Silva (exemplo)', 'ana.exemplo@teste.com', '11999990001', 'Centro', 'veterinario', 'ativo', '{}'),
('d0000000-0000-0000-0000-000000000002', 'Bruno Costa (exemplo)', NULL, '11999990002', 'Jardins', 'apoio_geral', 'ativo', '{"lar_temporario", "transporte"}'),
('d0000000-0000-0000-0000-000000000003', 'Carlos Souza (exemplo)', 'carlos.exemplo@teste.com', NULL, NULL, 'apoio_geral', 'inativo', '{"eventos"}'),
('d0000000-0000-0000-0000-000000000004', 'Daniela Lima (exemplo)', 'daniela.exemplo@teste.com', '11999990004', 'Vila Nova', 'veterinario', 'ativo', '{"lar_temporario", "divulgacao"}'),
('d0000000-0000-0000-0000-000000000005', 'Eduardo Alves (exemplo)', NULL, '11999990005', NULL, 'apoio_geral', 'ativo', '{"transporte"}'),
('d0000000-0000-0000-0000-000000000006', 'Fernanda Dias (exemplo)', 'fernanda.exemplo@teste.com', '11999990006', 'Centro', 'apoio_geral', 'inativo', '{}'),
('d0000000-0000-0000-0000-000000000007', 'Gustavo Reis (exemplo)', NULL, NULL, 'Bela Vista', 'apoio_geral', 'ativo', '{"lar_temporario", "eventos", "transporte"}'),
('d0000000-0000-0000-0000-000000000008', 'Helena Moraes (exemplo)', 'helena.exemplo@teste.com', '11999990008', NULL, 'veterinario', 'inativo', '{"divulgacao"}'),
('d0000000-0000-0000-0000-000000000009', 'Igor Santos (exemplo)', 'igor.exemplo@teste.com', '11999990009', 'Pinheiros', 'apoio_geral', 'ativo', '{"eventos", "divulgacao"}'),
('d0000000-0000-0000-0000-000000000010', 'Julia Castro (exemplo)', NULL, '11999990010', 'Mooca', 'apoio_geral', 'ativo', '{"lar_temporario"}'),
('d0000000-0000-0000-0000-000000000011', 'Kleber Nunes (exemplo)', 'kleber.exemplo@teste.com', NULL, 'Lapa', 'veterinario', 'ativo', '{"transporte", "eventos"}'),
('d0000000-0000-0000-0000-000000000012', 'Laura Mendes (exemplo)', NULL, '11999990012', 'Saúde', 'apoio_geral', 'inativo', '{"lar_temporario"}')
ON CONFLICT (id) DO NOTHING;

-- Associar automaticamente os voluntários 2, 4 e 7 a alguns lares temporários disponíveis no banco local
DO $$
DECLARE
    r record;
    v_ids uuid[] := ARRAY[
        'd0000000-0000-0000-0000-000000000002'::uuid, 
        'd0000000-0000-0000-0000-000000000004'::uuid, 
        'd0000000-0000-0000-0000-000000000007'::uuid
    ];
    i int := 1;
BEGIN
    FOR r IN SELECT id FROM public.lares_temporarios WHERE voluntario_id IS NULL LIMIT 3 LOOP
        UPDATE public.lares_temporarios SET voluntario_id = v_ids[i] WHERE id = r.id;
        i := i + 1;
    END LOOP;
END $$;