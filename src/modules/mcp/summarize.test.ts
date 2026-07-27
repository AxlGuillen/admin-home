import { describe, expect, it } from "vitest";

import type { LedgerMovement } from "./ledger";
import { byCategory, byMonth, pesos, toRow, totals } from "./summarize";

const mov = (over: Partial<LedgerMovement> = {}): LedgerMovement => ({
  month: "2026-07",
  date: "2026-07-10",
  description: "SUPER",
  amountCents: 10_000,
  category: "groceries",
  flow: "out",
  cardId: "c1",
  cardName: "BBVA Azul",
  cardType: "credito",
  owner: "Axl",
  movementClass: "regular",
  ...over,
});

describe("pesos", () => {
  it("convierte centavos sin dejar basura de punto flotante", () => {
    expect(pesos(196_051)).toBe(1960.51);
    expect(pesos(1)).toBe(0.01);
  });
});

describe("totals", () => {
  it("resume conteo, suma, promedio y el más caro", () => {
    const result = totals([
      mov({ amountCents: 10_000 }),
      mov({ amountCents: 30_000 }),
    ]);

    expect(result).toEqual({ count: 2, total: 400, average: 200, largest: 300 });
  });

  it("no devuelve -Infinity con la lista vacía", () => {
    expect(totals([])).toEqual({ count: 0, total: 0, average: 0, largest: 0 });
  });
});

describe("byCategory", () => {
  it("ordena por monto y reparte el porcentaje sobre el total", () => {
    const result = byCategory([
      mov({ category: "groceries", amountCents: 7_500 }),
      mov({ category: "restaurant", amountCents: 2_500 }),
    ]);

    expect(result).toEqual([
      { category: "groceries", total: 75, count: 1, share: 75 },
      { category: "restaurant", total: 25, count: 1, share: 25 },
    ]);
  });

  it("agrupa lo que no tiene categoría en other", () => {
    expect(byCategory([mov({ category: null })])[0].category).toBe("other");
  });
});

describe("byMonth", () => {
  it("ordena cronológicamente, no por monto", () => {
    const result = byMonth([
      mov({ month: "2026-07", amountCents: 100 }),
      mov({ month: "2026-05", amountCents: 900 }),
      mov({ month: "2026-06", amountCents: 500 }),
    ]);

    expect(result.map((m) => m.month)).toEqual(["2026-05", "2026-06", "2026-07"]);
  });
});

describe("toRow", () => {
  it("omite la clase cuando es la normal, para no gastar contexto", () => {
    expect(toRow(mov())).not.toHaveProperty("class");
  });

  it("la marca cuando el cargo no es un cargo regular", () => {
    expect(toRow(mov({ movementClass: "msi_installment" })).class).toBe(
      "msi_installment",
    );
  });
});
