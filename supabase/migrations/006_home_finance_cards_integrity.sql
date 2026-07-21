-- 006_home_finance_cards_integrity
--
-- Dos cosas:
--
-- 1. El dueño de una tarjeta tenía que ser una persona *del mismo hogar*, pero nada
--    lo obligaba: la FK simple solo exigía que la persona existiera. Verificado contra
--    la BD: se podía insertar una tarjeta del hogar A apuntando a una persona del hogar
--    B. No filtraba datos (la UI no la encontraba y mostraba "Sin dueño"), pero dejaba
--    la base en un estado imposible. Se arregla con una FK COMPUESTA, que lo vuelve
--    imposible por construcción en vez de depender de que el código se porte bien.
--
-- 2. Límite de crédito, para poder calcular el % de utilización cuando entren los
--    estados de cuenta.

-- ---------------------------------------------------------------------------
-- 1. FK compuesta (household_id, owner_person_id)
-- ---------------------------------------------------------------------------

-- Requisito para poder referenciar el par desde la tarjeta.
alter table public.home_people
  drop constraint if exists home_people_household_id_id_key;
alter table public.home_people
  add constraint home_people_household_id_id_key unique (household_id, id);

alter table public.home_finance_cards
  drop constraint if exists home_finance_cards_owner_person_id_fkey;
alter table public.home_finance_cards
  drop constraint if exists home_finance_cards_owner_fkey;

-- `on delete set null (owner_person_id)` limita el SET NULL a esa columna:
-- sin la lista, Postgres intentaría anular también household_id, que es NOT NULL,
-- y borrar a una persona reventaría.
--
-- MATCH SIMPLE (el default) hace que la FK no aplique cuando owner_person_id es
-- NULL, que es justo lo que queremos para tarjetas sin dueño.
alter table public.home_finance_cards
  add constraint home_finance_cards_owner_fkey
  foreign key (household_id, owner_person_id)
  references public.home_people (household_id, id)
  on delete set null (owner_person_id)
  on update cascade;

-- ---------------------------------------------------------------------------
-- 2. Límite de crédito
-- ---------------------------------------------------------------------------
alter table public.home_finance_cards
  add column if not exists credit_limit_cents bigint;

comment on column public.home_finance_cards.credit_limit_cents is
  'Límite de crédito en centavos. Solo aplica a tarjetas de crédito.';

alter table public.home_finance_cards
  drop constraint if exists home_finance_cards_credit_limit_positive;
alter table public.home_finance_cards
  add constraint home_finance_cards_credit_limit_positive
  check (credit_limit_cents is null or credit_limit_cents > 0);

-- Una tarjeta de débito no tiene línea de crédito.
alter table public.home_finance_cards
  drop constraint if exists home_finance_cards_credit_limit_type;
alter table public.home_finance_cards
  add constraint home_finance_cards_credit_limit_type
  check (type = 'credito' or credit_limit_cents is null);
