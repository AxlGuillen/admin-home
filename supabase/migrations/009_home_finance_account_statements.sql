-- 009_home_finance_account_statements
--
-- Debit account statements. A debit card is not a credit line: no cut/payment cycle,
-- no limit, no "pago para no generar intereses". Forcing it into home_finance_statements
-- would fill half the columns with lies, so it gets its own shape: opening/closing balance,
-- deposits and withdrawals, and movements that carry a running balance and a direction.
--
-- This account is where the money actually lives: salaries land here and the credit-card
-- payments (the SPEI/PAGOS the credit statements show as "pago") leave from here.

do $$ begin
  create type public.home_finance_account_direction as enum ('deposit', 'withdrawal');
exception when duplicate_object then null;
end $$;

create table if not exists public.home_finance_account_statements (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.home_households (id) on delete cascade,
  card_id      uuid not null,
  created_by   uuid references auth.users (id) on delete set null,

  period_start date not null,
  period_end   date not null,
  cut_date     date not null,
  days_in_period smallint,
  currency text not null default 'MXN',

  opening_balance_cents  bigint not null default 0,
  deposits_cents         bigint not null default 0,
  deposits_count         integer not null default 0,
  withdrawals_cents      bigint not null default 0,
  withdrawals_count      integer not null default 0,
  closing_balance_cents  bigint not null default 0,
  average_balance_cents  bigint,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint home_finance_account_stmt_id_household_key unique (id, household_id),
  constraint home_finance_account_stmt_card_cut_key unique (card_id, cut_date),

  constraint home_finance_account_stmt_card_fkey
    foreign key (card_id, household_id)
    references public.home_finance_cards (id, household_id)
    on delete cascade
    on update cascade,

  constraint home_finance_account_stmt_period check (period_end >= period_start),
  constraint home_finance_account_stmt_currency check (currency ~ '^[A-Z]{3}$')
);

comment on table public.home_finance_account_statements is
  'Admin Home / finanzas: estado de cuenta de una cuenta de débito. Nunca guarda el PDF ni datos completos de cuenta.';

create index if not exists home_finance_account_stmt_card_cut_idx
  on public.home_finance_account_statements (card_id, cut_date desc);

drop trigger if exists home_finance_account_stmt_updated_at on public.home_finance_account_statements;
create trigger home_finance_account_stmt_updated_at
  before update on public.home_finance_account_statements
  for each row execute function public.home_set_updated_at();

alter table public.home_finance_account_statements enable row level security;

drop policy if exists "home_finance_account_stmt_select" on public.home_finance_account_statements;
create policy "home_finance_account_stmt_select" on public.home_finance_account_statements for select
  to authenticated using (household_id in (select home_private.user_household_ids()));
drop policy if exists "home_finance_account_stmt_insert" on public.home_finance_account_statements;
create policy "home_finance_account_stmt_insert" on public.home_finance_account_statements for insert
  to authenticated with check (household_id in (select home_private.user_household_ids()));
drop policy if exists "home_finance_account_stmt_update" on public.home_finance_account_statements;
create policy "home_finance_account_stmt_update" on public.home_finance_account_statements for update
  to authenticated using (household_id in (select home_private.user_household_ids()))
  with check (household_id in (select home_private.user_household_ids()));
drop policy if exists "home_finance_account_stmt_delete" on public.home_finance_account_statements;
create policy "home_finance_account_stmt_delete" on public.home_finance_account_statements for delete
  to authenticated using (household_id in (select home_private.user_household_ids()));

create table if not exists public.home_finance_account_movements (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.home_households (id) on delete cascade,
  statement_id uuid not null,

  operation_date   date,
  liquidation_date date,
  description  text not null,
  amount_cents bigint not null,
  direction    public.home_finance_account_direction not null,
  balance_cents bigint,
  category     text,

  created_at timestamptz not null default now(),

  constraint home_finance_account_mov_stmt_fkey
    foreign key (statement_id, household_id)
    references public.home_finance_account_statements (id, household_id)
    on delete cascade
    on update cascade,

  constraint home_finance_account_mov_amount check (amount_cents >= 0),
  constraint home_finance_account_mov_desc check (btrim(description) <> ''),
  constraint home_finance_account_mov_category check (category is null or char_length(category) <= 40)
);

comment on table public.home_finance_account_movements is
  'Admin Home / finanzas: movimientos de una cuenta de débito. amount_cents es magnitud; el signo lo da direction.';

create index if not exists home_finance_account_mov_stmt_idx
  on public.home_finance_account_movements (statement_id);
create index if not exists home_finance_account_mov_household_date_idx
  on public.home_finance_account_movements (household_id, operation_date);

alter table public.home_finance_account_movements enable row level security;

drop policy if exists "home_finance_account_mov_select" on public.home_finance_account_movements;
create policy "home_finance_account_mov_select" on public.home_finance_account_movements for select
  to authenticated using (household_id in (select home_private.user_household_ids()));
drop policy if exists "home_finance_account_mov_insert" on public.home_finance_account_movements;
create policy "home_finance_account_mov_insert" on public.home_finance_account_movements for insert
  to authenticated with check (household_id in (select home_private.user_household_ids()));
drop policy if exists "home_finance_account_mov_update" on public.home_finance_account_movements;
create policy "home_finance_account_mov_update" on public.home_finance_account_movements for update
  to authenticated using (household_id in (select home_private.user_household_ids()))
  with check (household_id in (select home_private.user_household_ids()));
drop policy if exists "home_finance_account_mov_delete" on public.home_finance_account_movements;
create policy "home_finance_account_mov_delete" on public.home_finance_account_movements for delete
  to authenticated using (household_id in (select home_private.user_household_ids()));
