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
  /** Chip de dueño (home_people); opcionales hasta que el wiring los pueble. */
  ownerInitial?: string | null;
  ownerColor?: string | null;
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

// Categories that move money rather than spend it; excluded from "gasto" breakdowns.
const NON_SPEND = new Set([
  "payment",
  "refund",
  "transfer",
  "card_payment",
  "income",
]);

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

export type CardMonth = {
  month: string;
  spendCents: number;
  inflowCents: number;
  balanceCents: number | null;
  costCents: number;
};
export type CardMovement = {
  month: string;
  date: string | null;
  description: string;
  amountCents: number;
  category: string | null;
  flow: "in" | "out";
};
export type RecurringMerchant = {
  /** Nombre normalizado del comercio. */
  name: string;
  /** Meses distintos en los que aparece. */
  months: number;
  count: number;
  totalCents: number;
  perMonthCents: number;
};

export type DuplicateCharge = {
  description: string;
  amountCents: number;
  /** Fechas de los cargos idénticos, ordenadas. */
  dates: string[];
};

export type CardDetail = {
  card: {
    id: string;
    name: string;
    issuer: string | null;
    color: string | null;
    isCredit: boolean;
    ownerPersonId: string | null;
    limitCents: number | null;
  };
  months: CardMonth[];
  byCategory: CategorySlice[];
  subscriptions: Subscription[];
  movements: CardMovement[];
  recurring: RecurringMerchant[];
  duplicates: DuplicateCharge[];
  totals: {
    balanceCents: number | null;
    limitCents: number | null;
    costCents: number;
    spendCents: number;
    inflowCents: number;
  };
};

// Los bancos ensucian la descripción con el procesador de pago y el número de
// sucursal: "MERPAGO*ELTORITO", "FAR GUAD 1608". Para agrupar por comercio hay
// que quitar ambos, o el mismo negocio se cuenta como varios.
const PROCESSOR = /^(MERPAGO|MERCADOPAGO|CLIP MX|PAYCLIP|DLO|ZTL|TCONECT|SPEI)\s*\*?\s*/i;

export function merchantKey(description: string): string {
  return description
    .toUpperCase()
    .replace(PROCESSOR, "")
    .replace(/\s*\d{3,}\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getCardDetail(cardId: string): Promise<CardDetail | null> {
  await requireHousehold();
  const supabase = await createClient();

  const { data: card, error } = await supabase
    .from("home_finance_cards")
    .select("id, name, issuer, color, type, owner_person_id, credit_limit_cents")
    .eq("id", cardId)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar la tarjeta: ${error.message}`);
  if (!card) return null;

  const isCredit = card.type === "credito";
  const months = new Map<string, CardMonth>();
  const categories = new Map<string, number>();
  const movements: CardMovement[] = [];
  const subsMap = new Map<string, { months: Set<string>; total: number }>();

  const addCategory = (cat: string | null, cents: number) => {
    const c = cat ?? "other";
    if (NON_SPEND.has(c)) return;
    categories.set(c, (categories.get(c) ?? 0) + cents);
  };

  if (isCredit) {
    const { data: statements } = await supabase
      .from("home_finance_statements")
      .select(
        "id, cut_date, regular_charges_cents, payments_credits_cents, total_debt_cents, interest_cents, fees_cents, vat_cents",
      )
      .eq("card_id", cardId);
    const stmtIds = (statements ?? []).map((s) => s.id);
    const { data: txns } = stmtIds.length
      ? await supabase
          .from("home_finance_statement_transactions")
          .select("statement_id, category, kind, amount_cents, charge_date, description")
          .in("statement_id", stmtIds)
      : { data: [] };
    const stmtMonth = new Map(
      (statements ?? []).map((s) => [s.id, monthOf(s.cut_date)]),
    );

    for (const s of statements ?? []) {
      months.set(monthOf(s.cut_date), {
        month: monthOf(s.cut_date),
        spendCents: s.regular_charges_cents,
        inflowCents: s.payments_credits_cents,
        balanceCents: s.total_debt_cents,
        costCents: s.interest_cents + s.fees_cents + s.vat_cents,
      });
    }
    for (const t of txns ?? []) {
      const month = t.charge_date
        ? monthOf(t.charge_date)
        : (stmtMonth.get(t.statement_id) ?? "");
      const flow = t.kind === "charge" ? "out" : "in";
      movements.push({
        month,
        date: t.charge_date,
        description: t.description,
        amountCents: t.amount_cents,
        category: t.category,
        flow,
      });
      if (t.kind === "charge") addCategory(t.category, t.amount_cents);
      if (t.category === "subscription" && t.kind === "charge") {
        const name = subscriptionName(t.description);
        const e = subsMap.get(name) ?? { months: new Set<string>(), total: 0 };
        if (t.charge_date) e.months.add(monthOf(t.charge_date));
        e.total += t.amount_cents;
        subsMap.set(name, e);
      }
    }
  } else {
    const { data: statements } = await supabase
      .from("home_finance_account_statements")
      .select("id, cut_date, deposits_cents, withdrawals_cents, closing_balance_cents")
      .eq("card_id", cardId);
    const stmtIds = (statements ?? []).map((s) => s.id);
    const { data: movs } = stmtIds.length
      ? await supabase
          .from("home_finance_account_movements")
          .select("statement_id, category, direction, amount_cents, operation_date, description")
          .in("statement_id", stmtIds)
      : { data: [] };
    const stmtMonth = new Map(
      (statements ?? []).map((s) => [s.id, monthOf(s.cut_date)]),
    );

    for (const s of statements ?? []) {
      months.set(monthOf(s.cut_date), {
        month: monthOf(s.cut_date),
        spendCents: s.withdrawals_cents,
        inflowCents: s.deposits_cents,
        balanceCents: s.closing_balance_cents,
        costCents: 0,
      });
    }
    for (const m of movs ?? []) {
      const month = m.operation_date
        ? monthOf(m.operation_date)
        : (stmtMonth.get(m.statement_id) ?? "");
      const flow = m.direction === "deposit" ? "in" : "out";
      movements.push({
        month,
        date: m.operation_date,
        description: m.description,
        amountCents: m.amount_cents,
        category: m.category,
        flow,
      });
      if (m.direction === "withdrawal") addCategory(m.category, m.amount_cents);
    }
  }

  const monthList = [...months.values()].sort((a, b) =>
    a.month.localeCompare(b.month),
  );
  const byCategory = [...categories.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
  const subscriptions: Subscription[] = [...subsMap.entries()]
    .map(([name, e]) => ({
      name,
      months: e.months.size,
      totalCents: e.total,
      perMonthCents: Math.round(e.total / Math.max(e.months.size, 1)),
      cards: [card.name],
    }))
    .filter((s) => s.months >= 2)
    .sort((a, b) => b.perMonthCents - a.perMonthCents);

  // Comercios recurrentes: el goteo que la lista de suscripciones conocidas no ve.
  // Solo salidas; un pago recibido dos veces no es una fuga.
  const merchants = new Map<
    string,
    { months: Set<string>; count: number; total: number }
  >();
  for (const m of movements) {
    if (m.flow !== "out") continue;
    const key = merchantKey(m.description);
    if (!key) continue;
    const e = merchants.get(key) ?? {
      months: new Set<string>(),
      count: 0,
      total: 0,
    };
    if (m.month) e.months.add(m.month);
    e.count += 1;
    e.total += m.amountCents;
    merchants.set(key, e);
  }
  const recurring: RecurringMerchant[] = [...merchants.entries()]
    .map(([name, e]) => ({
      name,
      months: e.months.size,
      count: e.count,
      totalCents: e.total,
      perMonthCents: Math.round(e.total / Math.max(e.months.size, 1)),
    }))
    .filter((m) => m.months >= 3)
    .sort((a, b) => b.totalCents - a.totalCents);

  // Posible cobro doble: mismo comercio, mismo monto, dentro de 3 días.
  const dupMap = new Map<string, string[]>();
  for (const m of movements) {
    if (m.flow !== "out" || !m.date) continue;
    const key = `${merchantKey(m.description)}|${m.amountCents}`;
    dupMap.set(key, [...(dupMap.get(key) ?? []), m.date]);
  }
  const duplicates: DuplicateCharge[] = [];
  for (const [key, dates] of dupMap) {
    if (dates.length < 2) continue;
    const sorted = [...dates].sort();
    const close = sorted.filter((d, i) => {
      const prev = sorted[i - 1];
      const next = sorted[i + 1];
      const within = (a?: string, b?: string) =>
        a && b
          ? Math.abs(
              (new Date(b).getTime() - new Date(a).getTime()) / 86400000,
            ) <= 3
          : false;
      return within(prev, d) || within(d, next);
    });
    if (close.length < 2) continue;
    const [name, cents] = key.split("|");
    duplicates.push({
      description: name,
      amountCents: Number(cents),
      dates: close,
    });
  }
  duplicates.sort((a, b) => b.amountCents - a.amountCents);

  const latestMonth = monthList[monthList.length - 1];

  return {
    card: {
      id: card.id,
      name: card.name,
      issuer: card.issuer,
      color: card.color,
      isCredit,
      ownerPersonId: card.owner_person_id,
      limitCents: card.credit_limit_cents,
    },
    months: monthList,
    byCategory,
    recurring,
    duplicates,
    subscriptions,
    movements: movements.sort((a, b) =>
      (b.date ?? "").localeCompare(a.date ?? ""),
    ),
    totals: {
      balanceCents: latestMonth?.balanceCents ?? null,
      limitCents: card.credit_limit_cents,
      costCents: monthList.reduce((n, m) => n + m.costCents, 0),
      spendCents: monthList.reduce((n, m) => n + m.spendCents, 0),
      inflowCents: monthList.reduce((n, m) => n + m.inflowCents, 0),
    },
  };
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
