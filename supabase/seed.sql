-- SÓ PARA AMBIENTE LOCAL: roda em todo `supabase db reset` (config.toml).
-- Nunca rode este arquivo no banco real do projeto.

-- SEED: 8 Lares Temporários com diferentes status e capacidades
INSERT INTO public.lares_temporarios (id, nome_responsavel, contato, capacidade, status, endereco_regiao, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Ana Souza', '33999999991', 2, 'ocupado', 'Centro', true),
  ('22222222-2222-2222-2222-222222222222', 'Carlos Silva', '33999999992', 1, 'disponivel', 'Bairro Fátima', true),
  ('33333333-3333-3333-3333-333333333333', 'Mariana Reis', '33999999993', 3, 'em_avaliacao', 'Vila Esperança', true),
  ('44444444-4444-4444-4444-444444444444', 'João Pedro', '33999999994', 5, 'inativo', 'Matinha', false),
  ('55555555-5555-5555-5555-555555555555', 'Fernanda Lima', '33999999995', 1, 'ocupado', 'São Diogo', true),
  ('66666666-6666-6666-6666-666666666666', 'Roberto Alves', '33999999996', 4, 'disponivel', 'Vila Barreiro', true),
  ('77777777-7777-7777-7777-777777777777', 'Beatriz Costa', '33999999997', 2, 'disponivel', 'Centro', true),
  ('88888888-8888-8888-8888-888888888888', 'Juliana Moreira', '33999999998', 1, 'em_avaliacao', 'Bela Vista', true)
ON CONFLICT (id) DO NOTHING;

-- SEED: 3 Animais "Fakes" vinculados aos lares para simular lotação
INSERT INTO public.animais (id, nome, especie, porte, faixa_etaria, status_adocao, lar_temporario_id)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Rex (Seed)', 'Cachorro', 'M', 'adulto', 'em_lar_temporario', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bolinha (Seed)', 'Cachorro', 'P', 'filhote', 'em_lar_temporario', '11111111-1111-1111-1111-111111111111'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Mimi (Seed)', 'Gato', 'P', 'adulto', 'em_lar_temporario', '55555555-5555-5555-5555-555555555555')
ON CONFLICT (id) DO NOTHING;

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
