-- 004_home_finance_cards
--
-- Tarjetas del hogar, débito y crédito en la misma tabla.
--
-- Qué NO se guarda, a propósito: número de tarjeta, CVV y fecha de caducidad. No
-- habilitan ninguna función de esta app y convertirían una base doméstica en un
-- objetivo con datos de pago reales. `last_four` + `issuer` bastan para identificar
-- una tarjeta entre varias del mismo banco.
--
-- `cut_day` y `payment_day` son DÍAS DEL MES (1-31), no fechas: el ciclo se repite
-- cada mes. Cuando el día no existe (31 en febrero) se ajusta al último día del mes;
-- eso lo resuelve billing-cycle.ts, no la BD.

do $$ begin
  create type public.home_finance_card_type as enum ('credito', 'debito');
exception when duplicate_object then null;
end $$;

create table if not exists public.home_finance_cards (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.home_households (id) on delete cascade,
  created_by   uuid references auth.users (id) on delete set null,

  type         public.home_finance_card_type not null,
  name         text not null,
  description  text,
  issuer       text,
  last_four    text,
  color        text,

  cut_day      smallint,
  payment_day  smallint,

  -- Archivar en vez de borrar: el historial de pagos apuntará a la tarjeta y
  -- borrarla se lo llevaría por delante.
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint home_finance_cards_name_not_blank check (btrim(name) <> ''),
  constraint home_finance_cards_name_len check (char_length(name) <= 60),
  constraint home_finance_cards_description_len
    check (description is null or char_length(description) <= 500),
  constraint home_finance_cards_issuer_len
    check (issuer is null or char_length(issuer) <= 60),
  constraint home_finance_cards_last_four
    check (last_four is null or last_four ~ '^[0-9]{4}$'),
  constraint home_finance_cards_color
    check (color is null or color ~* '^#[0-9a-f]{6}$'),
  constraint home_finance_cards_cut_day
    check (cut_day is null or cut_day between 1 and 31),
  constraint home_finance_cards_payment_day
    check (payment_day is null or payment_day between 1 and 31),

  -- Una tarjeta de crédito sin ciclo no sirve para nada, y una de débito no tiene.
  constraint home_finance_cards_cycle check (
    (type = 'credito' and cut_day is not null and payment_day is not null)
    or (type = 'debito' and cut_day is null and payment_day is null)
  )
);

comment on table public.home_finance_cards is
  'Admin Home / finanzas: tarjetas del hogar. Nunca guarda PAN, CVV ni caducidad.';
comment on column public.home_finance_cards.cut_day is
  'Día del mes del corte (1-31). Se ajusta al último día en meses cortos.';
comment on column public.home_finance_cards.payment_day is
  'Día del mes límite de pago (1-31). Si es <= cut_day, cae en el mes siguiente al corte.';

create index if not exists home_finance_cards_household_active_idx
  on public.home_finance_cards (household_id)
  where archived_at is null;

drop trigger if exists home_finance_cards_updated_at on public.home_finance_cards;
create trigger home_finance_cards_updated_at
  before update on public.home_finance_cards
  for each row execute function public.home_set_updated_at();

alter table public.home_finance_cards enable row level security;

drop policy if exists "home_finance_cards_select" on public.home_finance_cards;
create policy "home_finance_cards_select"
  on public.home_finance_cards for select
  to authenticated
  using (household_id in (select home_private.user_household_ids()));

drop policy if exists "home_finance_cards_insert" on public.home_finance_cards;
create policy "home_finance_cards_insert"
  on public.home_finance_cards for insert
  to authenticated
  with check (household_id in (select home_private.user_household_ids()));

drop policy if exists "home_finance_cards_update" on public.home_finance_cards;
create policy "home_finance_cards_update"
  on public.home_finance_cards for update
  to authenticated
  using (household_id in (select home_private.user_household_ids()))
  with check (household_id in (select home_private.user_household_ids()));

drop policy if exists "home_finance_cards_delete" on public.home_finance_cards;
create policy "home_finance_cards_delete"
  on public.home_finance_cards for delete
  to authenticated
  using (household_id in (select home_private.user_household_ids()));
