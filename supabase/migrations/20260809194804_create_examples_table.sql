-- Tabela de demonstração usada pela feature "example" (apps/web + apps/api).
-- Serve só para provar o fluxo front -> Axios -> API -> Supabase; pode ser
-- removida quando a primeira feature de domínio real for criada.

create table if not exists public.examples (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- RLS habilitado e sem políticas: só o backend (apps/api), que usa a
-- service role key e por isso ignora RLS, consegue ler/escrever nessa
-- tabela. Nenhum cliente com a anon key (o navegador) acessa direto.
alter table public.examples enable row level security;
