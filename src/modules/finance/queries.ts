import "server-only";

import { requireHousehold } from "@/shared/auth/session";
import type { Tables } from "@/shared/supabase/database.types";
import { createClient } from "@/shared/supabase/server";

import type {
  AccountMovement,
  AccountStatement,
  AccountStatementWithMovements,
  Card,
  Statement,
  StatementTransaction,
  StatementWithTransactions,
} from "./types";

type CardRow = Tables<"home_finance_cards">;
type StatementRow = Tables<"home_finance_statements">;
type StatementTransactionRow = Tables<"home_finance_statement_transactions">;
type AccountStatementRow = Tables<"home_finance_account_statements">;
type AccountMovementRow = Tables<"home_finance_account_movements">;

/** DB is snake_case, the domain camelCase; the translation lives only here. */
export function toCard(row: CardRow): Card {
  return {
    id: row.id,
    householdId: row.household_id,
    type: row.type,
    name: row.name,
    description: row.description,
    issuer: row.issuer,
    lastFour: row.last_four,
    color: row.color,
    cutDay: row.cut_day,
    paymentDay: row.payment_day,
    ownerPersonId: row.owner_person_id,
    creditLimitCents: row.credit_limit_cents,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// No household_id filter: RLS already does it, and duplicating it would mask a broken policy.
export async function listCards({
  includeArchived = false,
  ownerPersonId,
}: {
  includeArchived?: boolean;
  /** Presentation filter. `"none"` = cards with no owner assigned. */
  ownerPersonId?: string | "none";
} = {}): Promise<Card[]> {
  await requireHousehold();
  const supabase = await createClient();

  let query = supabase.from("home_finance_cards").select("*");
  if (!includeArchived) query = query.is("archived_at", null);
  if (ownerPersonId === "none") query = query.is("owner_person_id", null);
  else if (ownerPersonId) query = query.eq("owner_person_id", ownerPersonId);

  const { data, error } = await query
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar las tarjetas: ${error.message}`);
  return data.map(toCard);
}

export async function getCard(id: string): Promise<Card | null> {
  await requireHousehold();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("home_finance_cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar la tarjeta: ${error.message}`);
  return data ? toCard(data) : null;
}

export function toStatement(row: StatementRow): Statement {
  return {
    id: row.id,
    householdId: row.household_id,
    cardId: row.card_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    cutDate: row.cut_date,
    paymentDueDate: row.payment_due_date,
    daysInPeriod: row.days_in_period,
    currency: row.currency,
    previousBalanceCents: row.previous_balance_cents,
    regularChargesCents: row.regular_charges_cents,
    installmentCapitalCents: row.installment_capital_cents,
    interestCents: row.interest_cents,
    feesCents: row.fees_cents,
    vatCents: row.vat_cents,
    paymentsCreditsCents: row.payments_credits_cents,
    noInterestPaymentCents: row.no_interest_payment_cents,
    minimumPaymentCents: row.minimum_payment_cents,
    minimumPlusInstallmentsCents: row.minimum_plus_installments_cents,
    totalDebtCents: row.total_debt_cents,
    creditLimitCents: row.credit_limit_cents,
    availableCreditCents: row.available_credit_cents,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toStatementTransaction(
  row: StatementTransactionRow,
): StatementTransaction {
  return {
    id: row.id,
    householdId: row.household_id,
    statementId: row.statement_id,
    operationDate: row.operation_date,
    chargeDate: row.charge_date,
    description: row.description,
    amountCents: row.amount_cents,
    kind: row.kind,
    movementClass: row.movement_class,
    category: row.category,
    originalAmountCents: row.original_amount_cents,
    originalCurrency: row.original_currency,
    fxRate: row.fx_rate,
    createdAt: row.created_at,
  };
}

export async function listStatements(cardId: string): Promise<Statement[]> {
  await requireHousehold();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("home_finance_statements")
    .select("*")
    .eq("card_id", cardId)
    .order("cut_date", { ascending: false });

  if (error)
    throw new Error(`No se pudieron cargar los estados de cuenta: ${error.message}`);
  return data.map(toStatement);
}

// Latest statement per card, for the consolidated payment calendar and utilization.
export async function latestStatementsByCard(): Promise<Statement[]> {
  await requireHousehold();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("home_finance_statements")
    .select("*")
    .order("cut_date", { ascending: false });

  if (error)
    throw new Error(`No se pudieron cargar los estados de cuenta: ${error.message}`);

  const seen = new Set<string>();
  const latest: Statement[] = [];
  for (const row of data) {
    if (seen.has(row.card_id)) continue;
    seen.add(row.card_id);
    latest.push(toStatement(row));
  }
  return latest;
}

export async function getStatementWithTransactions(
  id: string,
): Promise<StatementWithTransactions | null> {
  await requireHousehold();
  const supabase = await createClient();

  const { data: statement, error } = await supabase
    .from("home_finance_statements")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error)
    throw new Error(`No se pudo cargar el estado de cuenta: ${error.message}`);
  if (!statement) return null;

  const { data: transactions, error: txnError } = await supabase
    .from("home_finance_statement_transactions")
    .select("*")
    .eq("statement_id", id)
    .order("charge_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (txnError)
    throw new Error(`No se pudieron cargar los movimientos: ${txnError.message}`);

  return {
    ...toStatement(statement),
    transactions: transactions.map(toStatementTransaction),
  };
}

export function toAccountStatement(row: AccountStatementRow): AccountStatement {
  return {
    id: row.id,
    householdId: row.household_id,
    cardId: row.card_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    cutDate: row.cut_date,
    daysInPeriod: row.days_in_period,
    currency: row.currency,
    openingBalanceCents: row.opening_balance_cents,
    depositsCents: row.deposits_cents,
    depositsCount: row.deposits_count,
    withdrawalsCents: row.withdrawals_cents,
    withdrawalsCount: row.withdrawals_count,
    closingBalanceCents: row.closing_balance_cents,
    averageBalanceCents: row.average_balance_cents,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toAccountMovement(row: AccountMovementRow): AccountMovement {
  return {
    id: row.id,
    householdId: row.household_id,
    statementId: row.statement_id,
    operationDate: row.operation_date,
    liquidationDate: row.liquidation_date,
    description: row.description,
    amountCents: row.amount_cents,
    direction: row.direction,
    balanceCents: row.balance_cents,
    category: row.category,
    createdAt: row.created_at,
  };
}

export async function listAccountStatements(
  cardId: string,
): Promise<AccountStatement[]> {
  await requireHousehold();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("home_finance_account_statements")
    .select("*")
    .eq("card_id", cardId)
    .order("cut_date", { ascending: false });

  if (error)
    throw new Error(`No se pudieron cargar los estados de cuenta: ${error.message}`);
  return data.map(toAccountStatement);
}

export async function getAccountStatementWithMovements(
  id: string,
): Promise<AccountStatementWithMovements | null> {
  await requireHousehold();
  const supabase = await createClient();

  const { data: statement, error } = await supabase
    .from("home_finance_account_statements")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error)
    throw new Error(`No se pudo cargar el estado de cuenta: ${error.message}`);
  if (!statement) return null;

  const { data: movements, error: movError } = await supabase
    .from("home_finance_account_movements")
    .select("*")
    .eq("statement_id", id)
    .order("operation_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (movError)
    throw new Error(`No se pudieron cargar los movimientos: ${movError.message}`);

  return {
    ...toAccountStatement(statement),
    movements: movements.map(toAccountMovement),
  };
}
