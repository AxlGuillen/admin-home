-- 005_home_people
--
-- Personas del hogar. Son ETIQUETAS, no control de acceso: sirven para saber de
-- quién es cada cosa y poder filtrar. Todos los miembros del hogar ven y editan
-- todo, sin importar de quién sea la tarjeta.
--
-- Una persona no necesita cuenta en la app: `user_id` es opcional, para el caso en
-- que alguien de la casa sí use Admin Home. Así se puede registrar a quien no entra
-- nunca, y ligarle su cuenta después sin tocar las tarjetas que ya son suyas.

create table if not exists public.home_people (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.home_households (id) on delete cascade,
  user_id      uuid references auth.users (id) on delete set null,
  name         text not null,
  color        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint home_people_name_not_blank check (btrim(name) <> ''),
  constraint home_people_name_len check (char_length(name) <= 60),
  constraint home_people_color check (color is null or color ~* '^#[0-9a-f]{6}$')
);

comment on table public.home_people is
  'Admin Home: personas del hogar. Etiqueta para saber de quién es cada cosa, no control de acceso.';

-- Evita "Axl" y "axl" como dos personas distintas, que ensuciaría el filtro.
create unique index if not exists home_people_household_name_key
  on public.home_people (household_id, lower(name));

create index if not exists home_people_user_idx
  on public.home_people (user_id)
  where user_id is not null;

drop trigger if exists home_people_updated_at on public.home_people;
create trigger home_people_updated_at
  before update on public.home_people
  for each row execute function public.home_set_updated_at();

alter table public.home_people enable row level security;

drop policy if exists "home_people_select" on public.home_people;
create policy "home_people_select"
  on public.home_people for select
  to authenticated
  using (household_id in (select home_private.user_household_ids()));

drop policy if exists "home_people_insert" on public.home_people;
create policy "home_people_insert"
  on public.home_people for insert
  to authenticated
  with check (household_id in (select home_private.user_household_ids()));

drop policy if exists "home_people_update" on public.home_people;
create policy "home_people_update"
  on public.home_people for update
  to authenticated
  using (household_id in (select home_private.user_household_ids()))
  with check (household_id in (select home_private.user_household_ids()));

drop policy if exists "home_people_delete" on public.home_people;
create policy "home_people_delete"
  on public.home_people for delete
  to authenticated
  using (household_id in (select home_private.user_household_ids()));

-- ---------------------------------------------------------------------------
-- Dueño de la tarjeta
--
-- `on delete set null`: borrar a una persona no puede llevarse sus tarjetas por
-- delante. Quedan "sin dueño" y se les reasigna.
--
-- Distinto de `created_by`, que es quién la registró y no cambia nunca.
-- ---------------------------------------------------------------------------
alter table public.home_finance_cards
  add column if not exists owner_person_id uuid
  references public.home_people (id) on delete set null;

comment on column public.home_finance_cards.owner_person_id is
  'Persona del hogar dueña de la tarjeta. Solo etiqueta: no restringe quién la ve.';

create index if not exists home_finance_cards_owner_idx
  on public.home_finance_cards (owner_person_id)
  where owner_person_id is not null;

-- ---------------------------------------------------------------------------
-- Siembra: el dueño del hogar como primera persona, ligado a su cuenta.
-- ---------------------------------------------------------------------------
insert into public.home_people (household_id, user_id, name)
select m.household_id, m.user_id, coalesce(p.display_name, 'Yo')
from public.home_household_members m
left join public.home_profiles p on p.id = m.user_id
where m.role = 'owner'
on conflict do nothing;
