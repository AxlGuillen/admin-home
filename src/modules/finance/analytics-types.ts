// Tipos del análisis. No importa nada: lo consumen por igual el wrapper de Next
// y el servidor MCP, que corre como proceso Node plano.

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

// ── Formas de fila que consume el cómputo ────────────────────────────────
// Se declaran explícitas (y no como Tables<"…">) para que el cómputo sea
// testeable con literales y no arrastre los tipos generados de la BD.

export type CardRowLite = {
  id: string;
  name: string;
  issuer: string | null;
  color: string | null;
  type: string;
  owner_person_id: string | null;
  credit_limit_cents: number | null;
};

export type CreditStatementRow = {
  id: string;
  cut_date: string;
  regular_charges_cents: number;
  payments_credits_cents: number;
  total_debt_cents: number;
  interest_cents: number;
  fees_cents: number;
  vat_cents: number;
};

export type CreditTxnRow = {
  statement_id: string;
  category: string | null;
  kind: string;
  amount_cents: number;
  charge_date: string | null;
  description: string;
};

export type AccountStatementRowLite = {
  id: string;
  cut_date: string;
  deposits_cents: number;
  withdrawals_cents: number;
  closing_balance_cents: number;
};

export type AccountMovementRowLite = {
  statement_id: string;
  category: string | null;
  direction: string;
  amount_cents: number;
  operation_date: string | null;
  description: string;
};

/** Todo lo que necesita `computeCardDetail`. */
export type CardDetailRows = {
  card: CardRowLite;
  creditStatements: CreditStatementRow[];
  creditTxns: CreditTxnRow[];
  accountStatements: AccountStatementRowLite[];
  accountMovements: AccountMovementRowLite[];
};

export type OverviewCardRow = {
  id: string;
  name: string;
  color: string | null;
  type: string;
  credit_limit_cents: number | null;
};

export type OverviewStatementRow = CreditStatementRow & {
  card_id: string;
  credit_limit_cents: number | null;
};

/** Todo lo que necesita `computeFinanceOverview`. */
export type OverviewRows = {
  cards: OverviewCardRow[];
  statements: OverviewStatementRow[];
  /** Solo cargos: el overview no usa pagos ni devoluciones. */
  txns: CreditTxnRow[];
  accounts: { cut_date: string; closing_balance_cents: number }[];
};
