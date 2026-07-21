-- 003_home_households
--
-- El hogar es la unidad de propiedad de los datos: las tarjetas (y luego los pagos)
-- cuelgan de un hogar, no de un usuario, para que varias personas de la casa vean lo mismo.
--
-- Contexto de seguridad importante: `auth.users` es compartido por TODAS las apps de
-- este proyecto de Supabase. Cualquiera con cuenta en las apps hermanas puede pasar el
-- login de Admin Home. Por eso el acceso no lo da tener sesión, sino ser miembro de un
-- hogar: sin membresía, RLS no devuelve nada y la app manda a /no-access.

create schema if not exists home_private;
revoke all on schema home_private from public;
grant usage on schema home_private to authenticated;

create table if not exists public.home_households (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint home_households_name_not_blank check (btrim(name) <> ''),
  constraint home_households_name_len check (char_length(name) <= 60)
);

comment on table public.home_households is
  'Admin Home: hogar. Unidad de propiedad de los datos de la app.';

do $$ begin
  create type public.home_household_role as enum ('owner', 'member');
exception when duplicate_object then null;
end $$;

create table if not exists public.home_household_members (
  household_id uuid not null references public.home_households (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         public.home_household_role not null default 'member',
  created_at   timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index if not exists home_household_members_user_idx
  on public.home_household_members (user_id);

drop trigger if exists home_households_updated_at on public.home_households;
create trigger home_households_updated_at
  before update on public.home_households
  for each row execute function public.home_set_updated_at();

-- ---------------------------------------------------------------------------
-- Helper de RLS
--
-- Vive en `home_private` a propósito: PostgREST solo expone `public`, así que aquí
-- no queda como endpoint /rest/v1/rpc/. Es SECURITY DEFINER porque si la política de
-- home_household_members consultara home_household_members, Postgres entraría en
-- recursión infinita — el clásico error de RLS multi-tenant en Supabase.
-- ---------------------------------------------------------------------------
create or replace function home_private.user_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id
  from public.home_household_members
  where user_id = (select auth.uid());
$$;

revoke execute on function home_private.user_household_ids() from public;
grant execute on function home_private.user_household_ids() to authenticated;

-- ---------------------------------------------------------------------------
-- Políticas
-- ---------------------------------------------------------------------------
alter table public.home_households enable row level security;
alter table public.home_household_members enable row level security;

drop policy if exists "home_households_select_member" on public.home_households;
create policy "home_households_select_member"
  on public.home_households for select
  to authenticated
  using (id in (select home_private.user_household_ids()));

drop policy if exists "home_households_update_owner" on public.home_households;
create policy "home_households_update_owner"
  on public.home_households for update
  to authenticated
  using (
    exists (
      select 1 from public.home_household_members m
      where m.household_id = home_households.id
        and m.user_id = (select auth.uid())
        and m.role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from public.home_household_members m
      where m.household_id = home_households.id
        and m.user_id = (select auth.uid())
        and m.role = 'owner'
    )
  );

drop policy if exists "home_household_members_select_own_households" on public.home_household_members;
create policy "home_household_members_select_own_households"
  on public.home_household_members for select
  to authenticated
  using (household_id in (select home_private.user_household_ids()));

-- Sin políticas de insert/update/delete a propósito: dar de alta miembros se hace
-- desde el dashboard hasta que exista un flujo de invitaciones. Sin política, RLS
-- niega la operación por default.

-- ---------------------------------------------------------------------------
-- Siembra del hogar del dueño
--
-- Se busca por correo en vez de hardcodear el uuid, y es idempotente: si el usuario
-- ya pertenece a algún hogar, no hace nada.
-- ---------------------------------------------------------------------------
insert into public.home_profiles (id, display_name)
select u.id, split_part(u.email, '@', 1)
from auth.users u
where u.email = 'axl13.dev@gmail.com'
on conflict (id) do nothing;

with owner as (
  select id from auth.users where email = 'axl13.dev@gmail.com'
), created as (
  insert into public.home_households (name)
  select 'Casa'
  from owner
  where not exists (
    select 1 from public.home_household_members m, owner where m.user_id = owner.id
  )
  returning id
)
insert into public.home_household_members (household_id, user_id, role)
select created.id, owner.id, 'owner'
from created, owner
on conflict do nothing;
