-- Tabela de perfis: estende auth.users com o papel (role) usado pelo RBAC
-- do apps/api (ver apps/api/src/middleware/rbac.ts). Toda pessoa que faz
-- login vira uma linha aqui; por padrão como "colaborador" — promover para
-- "admin" é uma ação manual, feita direto no banco pelo tech lead.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'colaborador' check (role in ('admin', 'colaborador')),
  nome text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada usuário autenticado só pode ler o próprio perfil (usado pelo front
-- para saber se deve mostrar o Painel Admin). Escrita não é liberada via
-- RLS: quem grava é o backend (service role, que ignora RLS) ou o trigger
-- abaixo.
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Cria automaticamente um profile (role padrão "colaborador") sempre que
-- um novo usuário se registra no Supabase Auth.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
