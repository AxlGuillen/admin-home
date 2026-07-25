import { describe, expect, it } from "vitest";

import {
  computeCardDetail,
  computeDuplicates,
  computeFinanceOverview,
  computeRecurring,
  merchantKey,
} from "./analytics-compute";
import type {
  CardDetailRows,
  CardMovement,
  CardRowLite,
  OverviewRows,
} from "./analytics-types";

const creditCard: CardRowLite = {
  id: "c1",
  name: "BBVA Azul",
  issuer: "BBVA",
  color: "#123456",
  type: "credito",
  owner_person_id: "p1",
  credit_limit_cents: 1_000_000,
};

const emptyRows = (card: CardRowLite): CardDetailRows => ({
  card,
  creditStatements: [],
  creditTxns: [],
  accountStatements: [],
  accountMovements: [],
});

const mov = (over: Partial<CardMovement> = {}): CardMovement => ({
  month: "2026-07",
  date: "2026-07-10",
  description: "COMERCIO",
  amountCents: 10_000,
  category: "groceries",
  flow: "out",
  ...over,
});

describe("merchantKey", () => {
  it("quita el prefijo del procesador de pago", () => {
    expect(merchantKey("MERPAGO*ELTORITO")).toBe("ELTORITO");
    expect(merchantKey("CLIP MX*REST DON PIPIS")).toBe("REST DON PIPIS");
    expect(merchantKey("DLO*Uber Rides")).toBe("UBER RIDES");
  });

  it("quita el número de sucursal para agrupar la misma cadena", () => {
    expect(merchantKey("FAR GUAD 1608")).toBe("FAR GUAD");
    expect(merchantKey("FAR GUAD 1175")).toBe("FAR GUAD");
  });

  it("no recorta números cortos que son parte del nombre", () => {
    expect(merchantKey("OXXO 24")).toBe("OXXO 24");
  });
});

describe("computeRecurring", () => {
  it("solo cuenta comercios presentes en el mínimo de meses", () => {
    const movements = [
      mov({ month: "2026-05", description: "FAR GUAD 1608" }),
      mov({ month: "2026-06", description: "FAR GUAD 1175" }),
      mov({ month: "2026-07", description: "MERPAGO*FAR GUAD" }),
      mov({ month: "2026-07", description: "TIENDA UNICA" }),
    ];

    const result = computeRecurring(movements);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: "FAR GUAD",
      months: 3,
      count: 3,
      totalCents: 30_000,
      perMonthCents: 10_000,
    });
  });

  it("ignora las entradas: un ingreso repetido no es fuga", () => {
    const movements = ["2026-05", "2026-06", "2026-07"].map((month) =>
      mov({ month, description: "NOMINA", flow: "in" }),
    );

    expect(computeRecurring(movements)).toHaveLength(0);
  });
});

describe("computeDuplicates", () => {
  it("marca dos cargos idénticos dentro de la ventana", () => {
    const movements = [
      mov({ date: "2026-07-10", description: "SUSCRIPCION X" }),
      mov({ date: "2026-07-12", description: "SUSCRIPCION X" }),
    ];

    const result = computeDuplicates(movements);

    expect(result).toHaveLength(1);
    expect(result[0].dates).toEqual(["2026-07-10", "2026-07-12"]);
  });

  it("no marca el mismo monto si está fuera de la ventana", () => {
    const movements = [
      mov({ date: "2026-07-01", description: "SUSCRIPCION X" }),
      mov({ date: "2026-07-20", description: "SUSCRIPCION X" }),
    ];

    expect(computeDuplicates(movements)).toHaveLength(0);
  });

  it("no marca montos distintos del mismo comercio", () => {
    const movements = [
      mov({ date: "2026-07-10", amountCents: 10_000 }),
      mov({ date: "2026-07-11", amountCents: 20_000 }),
    ];

    expect(computeDuplicates(movements)).toHaveLength(0);
  });
});

describe("computeCardDetail · crédito", () => {
  const rows: CardDetailRows = {
    ...emptyRows(creditCard),
    creditStatements: [
      {
        id: "s1",
        cut_date: "2026-06-16",
        regular_charges_cents: 50_000,
        payments_credits_cents: 30_000,
        total_debt_cents: 70_000,
        interest_cents: 1_000,
        fees_cents: 500,
        vat_cents: 240,
      },
      {
        id: "s2",
        cut_date: "2026-07-16",
        regular_charges_cents: 80_000,
        payments_credits_cents: 60_000,
        total_debt_cents: 90_000,
        interest_cents: 0,
        fees_cents: 0,
        vat_cents: 0,
      },
    ],
    creditTxns: [
      {
        statement_id: "s1",
        category: "groceries",
        kind: "charge",
        amount_cents: 50_000,
        charge_date: "2026-06-10",
        description: "SUPER",
      },
      {
        statement_id: "s2",
        category: "payment",
        kind: "payment",
        amount_cents: 60_000,
        charge_date: "2026-07-05",
        description: "PAGO RECIBIDO",
      },
    ],
  };

  it("toma el saldo del último mes y acumula el costo del crédito", () => {
    const detail = computeCardDetail(rows);

    expect(detail.card.isCredit).toBe(true);
    expect(detail.months).toHaveLength(2);
    expect(detail.totals.balanceCents).toBe(90_000);
    expect(detail.totals.spendCents).toBe(130_000);
    expect(detail.totals.costCents).toBe(1_740);
  });

  it("excluye del gasto por categoría lo que solo mueve dinero", () => {
    const detail = computeCardDetail(rows);

    expect(detail.byCategory).toEqual([
      { category: "groceries", amount: 50_000 },
    ]);
  });

  it("ordena los movimientos del más reciente al más viejo", () => {
    const detail = computeCardDetail(rows);

    expect(detail.movements.map((m) => m.date)).toEqual([
      "2026-07-05",
      "2026-06-10",
    ]);
    expect(detail.movements[0].flow).toBe("in");
  });
});

describe("computeCardDetail · débito", () => {
  it("usa el saldo de cierre y trata el retiro como salida", () => {
    const detail = computeCardDetail({
      ...emptyRows({ ...creditCard, id: "d1", type: "debito" }),
      accountStatements: [
        {
          id: "a1",
          cut_date: "2026-07-22",
          deposits_cents: 100_000,
          withdrawals_cents: 40_000,
          closing_balance_cents: 60_000,
        },
      ],
      accountMovements: [
        {
          statement_id: "a1",
          category: "groceries",
          direction: "withdrawal",
          amount_cents: 40_000,
          operation_date: "2026-07-03",
          description: "SUPER",
        },
        {
          statement_id: "a1",
          category: "income",
          direction: "deposit",
          amount_cents: 100_000,
          operation_date: "2026-07-01",
          description: "NOMINA",
        },
      ],
    });

    expect(detail.card.isCredit).toBe(false);
    expect(detail.totals.balanceCents).toBe(60_000);
    expect(detail.totals.costCents).toBe(0);
    // El depósito no es gasto aunque traiga categoría.
    expect(detail.byCategory).toEqual([
      { category: "groceries", amount: 40_000 },
    ]);
  });
});

describe("computeFinanceOverview", () => {
  const rows: OverviewRows = {
    cards: [
      {
        id: "c1",
        name: "BBVA Azul",
        color: null,
        type: "credito",
        credit_limit_cents: 1_000_000,
      },
    ],
    statements: [
      {
        id: "s1",
        card_id: "c1",
        cut_date: "2026-06-16",
        credit_limit_cents: 1_000_000,
        regular_charges_cents: 50_000,
        payments_credits_cents: 0,
        total_debt_cents: 70_000,
        interest_cents: 1_000,
        fees_cents: 500,
        vat_cents: 240,
      },
      {
        id: "s2",
        card_id: "c1",
        cut_date: "2026-07-16",
        credit_limit_cents: 1_000_000,
        regular_charges_cents: 80_000,
        payments_credits_cents: 0,
        total_debt_cents: 90_000,
        interest_cents: 0,
        fees_cents: 0,
        vat_cents: 0,
      },
    ],
    txns: [
      {
        statement_id: "s1",
        category: "subscription",
        kind: "charge",
        amount_cents: 19_900,
        charge_date: "2026-06-02",
        description: "NETFLIX COM 1",
      },
      {
        statement_id: "s2",
        category: "subscription",
        kind: "charge",
        amount_cents: 19_900,
        charge_date: "2026-07-02",
        description: "NETFLIX.COM",
      },
    ],
    accounts: [
      { cut_date: "2026-06-22", closing_balance_cents: 10_000 },
      { cut_date: "2026-07-22", closing_balance_cents: 55_000 },
    ],
  };

  it("usa el estado más reciente por tarjeta para la deuda", () => {
    const overview = computeFinanceOverview(rows);

    expect(overview.totals.currentDebtCents).toBe(90_000);
    expect(overview.totals.limitCents).toBe(1_000_000);
    expect(overview.utilization).toHaveLength(1);
  });

  it("suma el costo del crédito de todos los meses", () => {
    const overview = computeFinanceOverview(rows);

    expect(overview.totals.spendCents).toBe(130_000);
    expect(overview.totals.creditCostCents).toBe(1_740);
    expect(overview.fees.map((f) => f.label)).toEqual([
      "Intereses",
      "Comisiones",
      "IVA",
    ]);
  });

  it("colapsa la suscripción a un nombre estable entre descripciones distintas", () => {
    const overview = computeFinanceOverview(rows);

    expect(overview.subscriptions).toHaveLength(1);
    expect(overview.subscriptions[0]).toMatchObject({
      name: "NETFLIX",
      months: 2,
      perMonthCents: 19_900,
    });
  });

  it("toma el saldo de débito del corte más reciente", () => {
    const overview = computeFinanceOverview(rows);

    expect(overview.totals.debitBalanceCents).toBe(55_000);
  });
});
