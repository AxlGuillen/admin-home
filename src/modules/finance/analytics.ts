import "server-only";

import { requireHousehold } from "@/shared/auth/session";
import { createClient } from "@/shared/supabase/server";

export type MonthPoint = { month: string; spend: number; cost: number };
export type CategorySlice = { category: string; amount: number };
export type CardUtilization = {
  cardId: string;
  name: string;
  color: string | null;
  debtCents: number;
  limitCents: number | null;
};
export type Subscription = {
  name: string;
  months: number;
  perMonthCents: number;
  totalCents: number;
  cards: string[];
};
export type FeeLine = { label: string; cents: number; count: number };

export type FinanceOverview = {
  totals: {
    spendCents: number;
    creditCostCents: number;
    interestCents: number;
    feesCents: number;
    currentDebtCents: number;
    limitCents: number;
    debitBalanceCents: number | null;
    subscriptionsPerMonthCents: number;
  };
  byMonth: MonthPoint[];
  byCategory: CategorySlice[];
  utilization: CardUtilization[];
  subscriptions: Subscription[];
  fees: FeeLine[];
};

const monthOf = (date: string) => date.slice(0, 7);

// A subscription description like "NETFLIX COM 1" / "OPENAI *CHATGPT SUBSCR" collapses to a stable name.
function subscriptionName(description: string): string {
  const upper = description.toUpperCase();
  const known = [
    "NETFLIX",
    "SPOTIFY",
    "OPENAI",
    "CHATGPT",
    "ADOBE",
    "GOOGLE ONE",
    "APPLE.COM",
    "ZOOM",
    "UDEMY",
    "FREEPIK",
    "AMAZON",
    "DISNEY",
    "HBO",
    "MICROSOFT",
  ];
  const hit = known.find((k) => upper.includes(k));
  if (hit) return hit === "APPLE.COM" ? "APPLE" : hit;
  return description.trim().slice(0, 24).toUpperCase();
}

export async function getFinanceOverview(): Promise<FinanceOverview> {
  await requireHousehold();
  const supabase = await createClient();

  const [cardsRes, stmtRes, txnRes, acctRes] = await Promise.all([
    supabase
      .from("home_finance_cards")
      .select("id, name, color, type, credit_limit_cents")
      .is("archived_at", null),
    supabase
      .from("home_finance_statements")
      .select(
        "id, card_id, cut_date, regular_charges_cents, interest_cents, fees_cents, vat_cents, total_debt_cents, credit_limit_cents",
      ),
    supabase
      .from("home_finance_statement_transactions")
      .select("statement_id, category, kind, amount_cents, charge_date, description")
      .eq("kind", "charge"),
    supabase
      .from("home_finance_account_statements")
      .select("cut_date, closing_balance_cents"),
  ]);

  for (const res of [cardsRes, stmtRes, txnRes, acctRes]) {
    if (res.error)
      throw new Error(`No se pudo cargar el análisis: ${res.error.message}`);
  }

  const cards = cardsRes.data ?? [];
  const statements = stmtRes.data ?? [];
  const txns = txnRes.data ?? [];
  const accounts = acctRes.data ?? [];

  const cardName = new Map(cards.map((c) => [c.id, c.name]));
  const stmtToCard = new Map(statements.map((s) => [s.id, s.card_id]));

  const months = new Map<string, MonthPoint>();
  for (const s of statements) {
    const key = monthOf(s.cut_date);
    const point = months.get(key) ?? { month: key, spend: 0, cost: 0 };
    point.spend += s.regular_charges_cents;
    point.cost += s.interest_cents + s.fees_cents + s.vat_cents;
    months.set(key, point);
  }
  const byMonth = [...months.values()].sort((a, b) =>
    a.month.localeCompare(b.month),
  );

  const categories = new Map<string, number>();
  for (const t of txns) {
    const cat = t.category ?? "other";
    if (cat === "payment" || cat === "refund") continue;
    categories.set(cat, (categories.get(cat) ?? 0) + t.amount_cents);
  }
  const byCategory = [...categories.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Latest statement per credit card drives current debt and utilization.
  const latestByCard = new Map<string, (typeof statements)[number]>();
  for (const s of statements) {
    const prev = latestByCard.get(s.card_id);
    if (!prev || s.cut_date > prev.cut_date) latestByCard.set(s.card_id, s);
  }
  const utilization: CardUtilization[] = [];
  let currentDebtCents = 0;
  let limitCents = 0;
  for (const [cardId, s] of latestByCard) {
    const card = cards.find((c) => c.id === cardId);
    const limit = s.credit_limit_cents ?? card?.credit_limit_cents ?? null;
    utilization.push({
      cardId,
      name: cardName.get(cardId) ?? "Tarjeta",
      color: card?.color ?? null,
      debtCents: s.total_debt_cents,
      limitCents: limit,
    });
    currentDebtCents += s.total_debt_cents;
    if (limit) limitCents += limit;
  }
  utilization.sort((a, b) => b.debtCents - a.debtCents);

  const subsMap = new Map<
    string,
    { months: Set<string>; total: number; cards: Set<string> }
  >();
  for (const t of txns) {
    if (t.category !== "subscription") continue;
    const name = subscriptionName(t.description);
    const entry = subsMap.get(name) ?? {
      months: new Set<string>(),
      total: 0,
      cards: new Set<string>(),
    };
    if (t.charge_date) entry.months.add(monthOf(t.charge_date));
    entry.total += t.amount_cents;
    const cn = cardName.get(stmtToCard.get(t.statement_id) ?? "");
    if (cn) entry.cards.add(cn);
    subsMap.set(name, entry);
  }
  const subscriptions: Subscription[] = [...subsMap.entries()]
    .map(([name, e]) => ({
      name,
      months: e.months.size,
      totalCents: e.total,
      perMonthCents: Math.round(e.total / Math.max(e.months.size, 1)),
      cards: [...e.cards],
    }))
    .filter((s) => s.months >= 2)
    .sort((a, b) => b.perMonthCents - a.perMonthCents);

  const feeStatements = statements.reduce(
    (acc, s) => {
      acc.interest += s.interest_cents;
      acc.fees += s.fees_cents;
      acc.vat += s.vat_cents;
      return acc;
    },
    { interest: 0, fees: 0, vat: 0 },
  );
  const feeTxns = txns.filter((t) => t.category === "fees");
  const fees: FeeLine[] = [
    { label: "Intereses", cents: feeStatements.interest, count: 0 },
    {
      label: "Comisiones",
      cents: feeStatements.fees,
      count: feeTxns.length,
    },
    { label: "IVA", cents: feeStatements.vat, count: 0 },
  ].filter((f) => f.cents > 0);

  const spendCents = byMonth.reduce((n, m) => n + m.spend, 0);
  const creditCostCents = feeStatements.interest + feeStatements.fees + feeStatements.vat;
  const subscriptionsPerMonthCents = subscriptions.reduce(
    (n, s) => n + s.perMonthCents,
    0,
  );

  const latestAccount = accounts.sort((a, b) =>
    b.cut_date.localeCompare(a.cut_date),
  )[0];

  return {
    totals: {
      spendCents,
      creditCostCents,
      interestCents: feeStatements.interest,
      feesCents: feeStatements.fees,
      currentDebtCents,
      limitCents,
      debitBalanceCents: latestAccount?.closing_balance_cents ?? null,
      subscriptionsPerMonthCents,
    },
    byMonth,
    byCategory,
    utilization,
    subscriptions,
    fees,
  };
}
