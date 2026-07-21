-- 001_home_foundation
--
-- Base del proyecto Admin Home. Este proyecto de Supabase es compartido con otras
-- apps (`ra_*`, `adala_*`), por eso TODO lo que sea de esta app lleva prefijo `home_`.
--
-- Contenido:
--   - home_set_updated_at()      trigger genérico de auditoría
--   - home_profiles              perfil 1:1 con auth.users
--   - home_handle_new_user()     crea el perfil al registrarse

-- ---------------------------------------------------------------------------
-- Helper: mantiene updated_at al día en cualquier tabla home_*
-- ---------------------------------------------------------------------------
create or replace function public.home_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- home_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.home_profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.home_profiles is
  'Admin Home: perfil del usuario, 1:1 con auth.users.';

drop trigger if exists home_profiles_updated_at on public.home_profiles;
create trigger home_profiles_updated_at
  before update on public.home_profiles
  for each row execute function public.home_set_updated_at();

alter table public.home_profiles enable row level security;

-- Cada quien ve y edita solo su propio perfil. `(select auth.uid())` en vez de
-- `auth.uid()` para que Postgres lo evalúe una vez por query y no por fila.
drop policy if exists "home_profiles_select_own" on public.home_profiles;
create policy "home_profiles_select_own"
  on public.home_profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "home_profiles_update_own" on public.home_profiles;
create policy "home_profiles_update_own"
  on public.home_profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "home_profiles_insert_own" on public.home_profiles;
create policy "home_profiles_insert_own"
  on public.home_profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- Alta automática de perfil al registrarse
-- ---------------------------------------------------------------------------
create or replace function public.home_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.home_profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists home_on_auth_user_created on auth.users;
create trigger home_on_auth_user_created
  after insert on auth.users
  for each row execute function public.home_handle_new_user();
