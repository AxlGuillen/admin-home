// Cómputo puro del análisis: filas → resultados. Sin `server-only`, sin cliente
// de Supabase y sin auth, para que lo usen igual el Server Component y el
// servidor MCP. Aquí viven las reglas del dominio; cambiarlas aquí las cambia
// en los dos consumidores a la vez.

import type {
  CardDetail,
  CardDetailRows,
  CardMonth,
  CardMovement,
  CardUtilization,
  DuplicateCharge,
  FeeLine,
  FinanceOverview,
  MonthPoint,
  OverviewRows,
  RecurringMerchant,
  Subscription,
} from "./analytics-types";

export const monthOf = (date: string) => date.slice(0, 7);

/** Categorías que mueven dinero en vez de gastarlo; se excluyen del gasto. */
export const NON_SPEND = new Set([
  "payment",
  "refund",
  "transfer",
  "card_payment",
  "income",
]);

/** "NETFLIX COM 1" / "OPENAI *CHATGPT SUBSCR" colapsan a un nombre estable. */
export function subscriptionName(description: string): string {
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

// Los bancos ensucian la descripción con el procesador de pago y el número de
// sucursal: "MERPAGO*ELTORITO", "FAR GUAD 1608". Para agrupar por comercio hay
// que quitar ambos, o el mismo negocio se cuenta como varios.
const PROCESSOR =
  /^(MERPAGO|MERCADOPAGO|CLIP MX|PAYCLIP|DLO|ZTL|TCONECT|SPEI)\s*\*?\s*/i;

export function merchantKey(description: string): string {
  return description
    .toUpperCase()
    .replace(PROCESSOR, "")
    .replace(/\s*\d{3,}\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

const DAY_MS = 86_400_000;

/** Comercios que aparecen en varios meses: el goteo que no se ve de un cargo. */
export function computeRecurring(
  movements: CardMovement[],
  minMonths = 3,
): RecurringMerchant[] {
  const merchants = new Map<
    string,
    { months: Set<string>; count: number; total: number }
  >();

  for (const m of movements) {
    // Solo salidas: un pago recibido dos veces no es una fuga.
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

  return [...merchants.entries()]
    .map(([name, e]) => ({
      name,
      months: e.months.size,
      count: e.count,
      totalCents: e.total,
      perMonthCents: Math.round(e.total / Math.max(e.months.size, 1)),
    }))
    .filter((m) => m.months >= minMonths)
    .sort((a, b) => b.totalCents - a.totalCents);
}

/** Mismo comercio y mismo monto dentro de N días: sospecha de cobro doble. */
export function computeDuplicates(
  movements: CardMovement[],
  withinDays = 3,
): DuplicateCharge[] {
  const byKey = new Map<string, string[]>();
  for (const m of movements) {
    if (m.flow !== "out" || !m.date) continue;
    const key = `${merchantKey(m.description)}|${m.amountCents}`;
    byKey.set(key, [...(byKey.get(key) ?? []), m.date]);
  }

  const duplicates: DuplicateCharge[] = [];
  for (const [key, dates] of byKey) {
    if (dates.length < 2) continue;
    const sorted = [...dates].sort();
    const near = (a?: string, b?: string) =>
      a && b
        ? Math.abs(new Date(b).getTime() - new Date(a).getTime()) / DAY_MS <=
          withinDays
        : false;
    const close = sorted.filter(
      (d, i) => near(sorted[i - 1], d) || near(d, sorted[i + 1]),
    );
    if (close.length < 2) continue;
    const [name, cents] = key.split("|");
    duplicates.push({
      description: name,
      amountCents: Number(cents),
      dates: close,
    });
  }
  return duplicates.sort((a, b) => b.amountCents - a.amountCents);
}

export function computeCardDetail(rows: CardDetailRows): CardDetail {
  const { card } = rows;
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
    const stmtMonth = new Map(
      rows.creditStatements.map((s) => [s.id, monthOf(s.cut_date)]),
    );
    for (const s of rows.creditStatements) {
      months.set(monthOf(s.cut_date), {
        month: monthOf(s.cut_date),
        spendCents: s.regular_charges_cents,
        inflowCents: s.payments_credits_cents,
        balanceCents: s.total_debt_cents,
        costCents: s.interest_cents + s.fees_cents + s.vat_cents,
      });
    }
    for (const t of rows.creditTxns) {
      const month = t.charge_date
        ? monthOf(t.charge_date)
        : (stmtMonth.get(t.statement_id) ?? "");
      movements.push({
        month,
        date: t.charge_date,
        description: t.description,
        amountCents: t.amount_cents,
        category: t.category,
        flow: t.kind === "charge" ? "out" : "in",
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
    const stmtMonth = new Map(
      rows.accountStatements.map((s) => [s.id, monthOf(s.cut_date)]),
    );
    for (const s of rows.accountStatements) {
      months.set(monthOf(s.cut_date), {
        month: monthOf(s.cut_date),
        spendCents: s.withdrawals_cents,
        inflowCents: s.deposits_cents,
        balanceCents: s.closing_balance_cents,
        costCents: 0,
      });
    }
    for (const m of rows.accountMovements) {
      const month = m.operation_date
        ? monthOf(m.operation_date)
        : (stmtMonth.get(m.statement_id) ?? "");
      movements.push({
        month,
        date: m.operation_date,
        description: m.description,
        amountCents: m.amount_cents,
        category: m.category,
        flow: m.direction === "deposit" ? "in" : "out",
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
    recurring: computeRecurring(movements),
    duplicates: computeDuplicates(movements),
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

export function computeFinanceOverview(rows: OverviewRows): FinanceOverview {
  const { cards, statements, txns, accounts } = rows;

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

  // El último estado de cuenta por tarjeta manda la deuda y la utilización.
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
    { label: "Comisiones", cents: feeStatements.fees, count: feeTxns.length },
    { label: "IVA", cents: feeStatements.vat, count: 0 },
  ].filter((f) => f.cents > 0);

  const spendCents = byMonth.reduce((n, m) => n + m.spend, 0);
  const creditCostCents =
    feeStatements.interest + feeStatements.fees + feeStatements.vat;
  const subscriptionsPerMonthCents = subscriptions.reduce(
    (n, s) => n + s.perMonthCents,
    0,
  );

  const latestAccount = [...accounts].sort((a, b) =>
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
