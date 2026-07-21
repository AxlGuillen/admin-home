-- 008_home_finance_txn_class
--
-- Statements mix regular charges with deferred (MSI) purchases, their monthly
-- installments, and commissions. They must be told apart: a spend total that counts
-- both an MSI purchase and its installments double-counts. kind gives the sign;
-- movement_class refines a charge into what it actually is.

do $$ begin
  create type public.home_finance_txn_class as enum (
    'regular', 'commission', 'msi_purchase', 'msi_installment'
  );
exception when duplicate_object then null;
end $$;

alter table public.home_finance_statement_transactions
  add column if not exists movement_class public.home_finance_txn_class;

-- A class describes a charge; payments and refunds have none.
alter table public.home_finance_statement_transactions
  drop constraint if exists home_finance_stmt_txn_class_charge;
alter table public.home_finance_statement_transactions
  add constraint home_finance_stmt_txn_class_charge
  check ((kind = 'charge') = (movement_class is not null));
