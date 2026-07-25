// Lectura de filas para el análisis. Recibe el cliente en vez de crearlo: el
// Server Component pasa el de cookies y el servidor MCP pasará el suyo con la
// sesión guardada. Sin `server-only` a propósito.

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/shared/supabase/database.types";

import type { CardDetailRows, OverviewRows } from "./analytics-types";

type Client = SupabaseClient<Database>;

const CARD_COLS = "id, name, issuer, color, type, owner_person_id, credit_limit_cents";
const CREDIT_STMT_COLS =
  "id, cut_date, regular_charges_cents, payments_credits_cents, total_debt_cents, interest_cents, fees_cents, vat_cents";
const CREDIT_TXN_COLS =
  "statement_id, category, kind, amount_cents, charge_date, description";
const ACCT_STMT_COLS =
  "id, cut_date, deposits_cents, withdrawals_cents, closing_balance_cents";
const ACCT_MOV_COLS =
  "statement_id, category, direction, amount_cents, operation_date, description";

/** Devuelve null si la tarjeta no existe o RLS la oculta. */
export async function fetchCardDetailRows(
  supabase: Client,
  cardId: string,
): Promise<CardDetailRows | null> {
  const { data: card, error } = await supabase
    .from("home_finance_cards")
    .select(CARD_COLS)
    .eq("id", cardId)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar la tarjeta: ${error.message}`);
  if (!card) return null;

  const empty: CardDetailRows = {
    card,
    creditStatements: [],
    creditTxns: [],
    accountStatements: [],
    accountMovements: [],
  };

  if (card.type === "credito") {
    const { data: statements } = await supabase
      .from("home_finance_statements")
      .select(CREDIT_STMT_COLS)
      .eq("card_id", cardId);
    const ids = (statements ?? []).map((s) => s.id);
    const { data: txns } = ids.length
      ? await supabase
          .from("home_finance_statement_transactions")
          .select(CREDIT_TXN_COLS)
          .in("statement_id", ids)
      : { data: [] };
    return { ...empty, creditStatements: statements ?? [], creditTxns: txns ?? [] };
  }

  const { data: statements } = await supabase
    .from("home_finance_account_statements")
    .select(ACCT_STMT_COLS)
    .eq("card_id", cardId);
  const ids = (statements ?? []).map((s) => s.id);
  const { data: movs } = ids.length
    ? await supabase
        .from("home_finance_account_movements")
        .select(ACCT_MOV_COLS)
        .in("statement_id", ids)
    : { data: [] };
  return {
    ...empty,
    accountStatements: statements ?? [],
    accountMovements: movs ?? [],
  };
}

export async function fetchOverviewRows(supabase: Client): Promise<OverviewRows> {
  const [cardsRes, stmtRes, txnRes, acctRes] = await Promise.all([
    supabase
      .from("home_finance_cards")
      .select("id, name, color, type, credit_limit_cents")
      .is("archived_at", null),
    supabase
      .from("home_finance_statements")
      .select(`card_id, credit_limit_cents, ${CREDIT_STMT_COLS}`),
    supabase
      .from("home_finance_statement_transactions")
      .select(CREDIT_TXN_COLS)
      .eq("kind", "charge"),
    supabase
      .from("home_finance_account_statements")
      .select("cut_date, closing_balance_cents"),
  ]);

  for (const res of [cardsRes, stmtRes, txnRes, acctRes]) {
    if (res.error)
      throw new Error(`No se pudo cargar el análisis: ${res.error.message}`);
  }

  return {
    cards: cardsRes.data ?? [],
    statements: stmtRes.data ?? [],
    txns: txnRes.data ?? [],
    accounts: acctRes.data ?? [],
  };
}
