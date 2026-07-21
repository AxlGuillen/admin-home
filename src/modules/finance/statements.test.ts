import { describe, expect, it } from "vitest";

import { statementImportSchema } from "./schemas";

const base = {
  issuer: "BBVA",
  product: "BBVA Oro",
  lastFour: "7677",
  ownerName: "Maria de los Angeles Luna Anguiano",
  periodStart: "2026-05-09",
  periodEnd: "2026-06-08",
  cutDate: "2026-06-08",
  paymentDueDate: "2026-06-29",
  transactions: [],
};

describe("statementImportSchema", () => {
  it("converts pesos to cents and defaults missing amounts to zero", () => {
    const result = statementImportSchema.parse({
      ...base,
      noInterestPayment: 26188.58,
      totalDebt: 26188.58,
    });

    expect(result.noInterestPayment).toBe(2618858);
    expect(result.totalDebt).toBe(2618858);
    expect(result.regularCharges).toBe(0);
    expect(result.currency).toBe("MXN");
    expect(result.creditLimit).toBeNull();
  });

  it("parses a charge in a foreign currency keeping the MXN amount and the original", () => {
    const result = statementImportSchema.parse({
      ...base,
      transactions: [
        {
          operationDate: "2026-04-06",
          chargeDate: "2026-04-07",
          description: "ZOOM.COM",
          amount: 3527.88,
          kind: "charge",
          category: "suscripcion",
          originalAmount: 197.08,
          originalCurrency: "USD",
          fxRate: 17.9,
        },
      ],
    });

    const txn = result.transactions[0];
    expect(txn.amount).toBe(352788);
    expect(txn.originalAmount).toBe(19708);
    expect(txn.originalCurrency).toBe("USD");
    expect(txn.fxRate).toBe(17.9);
  });

  it("rejects a negative transaction amount", () => {
    const parsed = statementImportSchema.safeParse({
      ...base,
      transactions: [{ description: "X", amount: -10, kind: "charge" }],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects a bad cut date", () => {
    const parsed = statementImportSchema.safeParse({ ...base, cutDate: "08-06-2026" });
    expect(parsed.success).toBe(false);
  });
});
