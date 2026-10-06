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