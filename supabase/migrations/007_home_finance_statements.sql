-- 007_home_finance_statements
--
-- Monthly statement per card (the CONDUSEF-mandated format is the same across banks,
-- so one normalized shape fits INVEX, BBVA, Banamex, Nu, etc.) plus its transactions.
-- Raw PDFs are never stored; PAN/RFC/CLABE are dropped on ingest. Only last_four lives
-- on the card. Amounts in cents, following the finance module.

-- Composite FK targets below need (id, household_id) unique on the parent tables.
alter table public.home_finance_cards
  drop constraint if exists home_finance_cards_id_household_key;
alter table public.home_finance_cards
  add constraint home_finance_cards_id_household_key unique (id, household_id);

-- ---------------------------------------------------------------------------
-- Statement header: one row per (card, cut_date)
-- ---------------------------------------------------------------------------
create table if not exists public.home_finance_statements (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.home_households (id) on delete cascade,
  card_id      uuid not null,
  created_by   uuid references auth.users (id) on delete set null,

  period_start     date not null,
  period_end       date not null,
  cut_date         date not null,
  payment_due_date date not null,
  days_in_period   smallint,

  currency text not null default 'MXN',

  -- Balances can be negative (saldo a favor); charges/payments are magnitudes.
  previous_balance_cents          bigint not null default 0,
  regular_charges_cents           bigint not null default 0,
  installment_capital_cents       bigint not null default 0,
  interest_cents                  bigint not null default 0,
  fees_cents                      bigint not null default 0,
  vat_cents                       bigint not null default 0,
  payments_credits_cents          bigint not null default 0,
  no_interest_payment_cents       bigint not null default 0,
  minimum_payment_cents           bigint not null default 0,
  minimum_plus_installments_cents bigint not null default 0,
  total_debt_cents                bigint not null default 0,
  credit_limit_cents              bigint,
  available_credit_cents          bigint,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint home_finance_statements_id_household_key unique (id, household_id),
  constraint home_finance_statements_card_cut_key unique (card_id, cut_date),

  -- Statement must belong to the same household as its card (enforced, not trusted).
  constraint home_finance_statements_card_fkey
    foreign key (card_id, household_id)
    references public.home_finance_cards (id, household_id)
    on delete cascade
    on update cascade,

  constraint home_finance_statements_period check (period_end >= period_start),
  constraint home_finance_statements_due check (payment_due_date >= cut_date),
  constraint home_finance_statements_days
    check (days_in_period is null or days_in_period between 1 and 366),
  constraint home_finance_statements_currency check (currency ~ '^[A-Z]{3}$'),
  constraint home_finance_statements_credit_limit
    check (credit_limit_cents is null or credit_limit_cents > 0)
);

comment on table public.home_finance_statements is
  'Admin Home / finanzas: estado de cuenta mensual por tarjeta. Nunca guarda PAN/RFC/CLABE ni el PDF.';

create index if not exists home_finance_statements_card_cut_idx
  on public.home_finance_statements (card_id, cut_date desc);
create index if not exists home_finance_statements_household_due_idx
  on public.home_finance_statements (household_id, payment_due_date);

drop trigger if exists home_finance_statements_updated_at on public.home_finance_statements;
create trigger home_finance_statements_updated_at
  before update on public.home_finance_statements
  for each row execute function public.home_set_updated_at();

alter table public.home_finance_statements enable row level security;

drop policy if exists "home_finance_statements_select" on public.home_finance_statements;
create policy "home_finance_statements_select"
  on public.home_finance_statements for select
  to authenticated
  using (household_id in (select home_private.user_household_ids()));

drop policy if exists "home_finance_statements_insert" on public.home_finance_statements;
create policy "home_finance_statements_insert"
  on public.home_finance_statements for insert
  to authenticated
  with check (household_id in (select home_private.user_household_ids()));

drop policy if exists "home_finance_statements_update" on public.home_finance_statements;
create policy "home_finance_statements_update"
  on public.home_finance_statements for update
  to authenticated
  using (household_id in (select home_private.user_household_ids()))
  with check (household_id in (select home_private.user_household_ids()));

drop policy if exists "home_finance_statements_delete" on public.home_finance_statements;
create policy "home_finance_statements_delete"
  on public.home_finance_statements for delete
  to authenticated
  using (household_id in (select home_private.user_household_ids()));

-- ---------------------------------------------------------------------------
-- Transactions: one row per movement
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.home_finance_txn_kind as enum ('charge', 'payment', 'refund');
exception when duplicate_object then null;
end $$;

create table if not exists public.home_finance_statement_transactions (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.home_households (id) on delete cascade,
  statement_id uuid not null,

  operation_date date,
  charge_date    date,
  description    text not null,
  amount_cents   bigint not null,
  kind           public.home_finance_txn_kind not null,
  category       text,

  -- Set together when the charge was in a foreign currency.
  original_amount_cents bigint,
  original_currency     text,
  fx_rate               numeric(12, 6),

  created_at timestamptz not null default now(),

  constraint home_finance_stmt_txn_statement_fkey
    foreign key (statement_id, household_id)
    references public.home_finance_statements (id, household_id)
    on delete cascade
    on update cascade,

  constraint home_finance_stmt_txn_amount check (amount_cents >= 0),
  constraint home_finance_stmt_txn_desc check (btrim(description) <> ''),
  constraint home_finance_stmt_txn_category
    check (category is null or char_length(category) <= 40),
  constraint home_finance_stmt_txn_original_currency
    check (original_currency is null or original_currency ~ '^[A-Z]{3}$'),
  constraint home_finance_stmt_txn_original_all_or_none check (
    (original_amount_cents is null and original_currency is null and fx_rate is null)
    or (original_amount_cents is not null and original_currency is not null and fx_rate is not null)
  )
);

comment on table public.home_finance_statement_transactions is
  'Admin Home / finanzas: movimientos de un estado de cuenta. amount_cents es magnitud; el signo lo da kind.';

create index if not exists home_finance_stmt_txn_statement_idx
  on public.home_finance_statement_transactions (statement_id);
create index if not exists home_finance_stmt_txn_household_charge_idx
  on public.home_finance_statement_transactions (household_id, charge_date);
create index if not exists home_finance_stmt_txn_category_idx
  on public.home_finance_statement_transactions (household_id, category)
  where category is not null;

alter table public.home_finance_statement_transactions enable row level security;

drop policy if exists "home_finance_stmt_txn_select" on public.home_finance_statement_transactions;
create policy "home_finance_stmt_txn_select"
  on public.home_finance_statement_transactions for select
  to authenticated
  using (household_id in (select home_private.user_household_ids()));

drop policy if exists "home_finance_stmt_txn_insert" on public.home_finance_statement_transactions;
create policy "home_finance_stmt_txn_insert"
  on public.home_finance_statement_transactions for insert
  to authenticated
  with check (household_id in (select home_private.user_household_ids()));

drop policy if exists "home_finance_stmt_txn_update" on public.home_finance_statement_transactions;
create policy "home_finance_stmt_txn_update"
  on public.home_finance_statement_transactions for update
  to authenticated
  using (household_id in (select home_private.user_household_ids()))
  with check (household_id in (select home_private.user_household_ids()));

drop policy if exists "home_finance_stmt_txn_delete" on public.home_finance_statement_transactions;
create policy "home_finance_stmt_txn_delete"
  on public.home_finance_statement_transactions for delete
  to authenticated
  using (household_id in (select home_private.user_household_ids()));
