import { describe, expect, it } from "vitest";

import {
  filterMovements,
  movementFilterSchema,
  resolveCard,
  type MovementFilter,
} from "./filters";
import type { LedgerCard, LedgerMovement } from "./ledger";

const filter = (over: Partial<MovementFilter> = {}): MovementFilter =>
  movementFilterSchema.parse(over);

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

const card = (over: Partial<LedgerCard> = {}): LedgerCard => ({
  id: "11111111-1111-4111-8111-111111111111",
  name: "BBVA Azul",
  issuer: "BBVA",
  lastFour: "1234",
  type: "credito",
  owner: "Axl",
  cutDay: 16,
  paymentDay: 5,
  creditLimitCents: 1_000_000,
  archived: false,
  ...over,
});

describe("lo que cuenta como gasto", () => {
  const moneyMoves = [
    mov({ category: "transfer", description: "SPEI ENVIADO" }),
    mov({ category: "card_payment", description: "PAGO TARJETA" }),
    mov({ category: "income", description: "NOMINA", flow: "in" }),
  ];

  it("excluye lo que solo mueve dinero", () => {
    const result = filterMovements([mov(), ...moneyMoves], filter());

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("groceries");
  });

  it("los devuelve si se piden explícitamente", () => {
    const result = filterMovements(moneyMoves, filter({ includeMoneyMoves: true }));

    expect(result).toHaveLength(2); // el ingreso sigue fuera por ser flow "in"
  });

  it("pedir la categoría gana sobre la exclusión por defecto", () => {
    const result = filterMovements(moneyMoves, filter({ category: "transfer" }));

    expect(result).toHaveLength(1);
    expect(result[0].description).toBe("SPEI ENVIADO");
  });

  it("no esconde ingresos cuando se piden las entradas", () => {
    const result = filterMovements(moneyMoves, filter({ flow: "in" }));

    expect(result.map((m) => m.description)).toEqual(["NOMINA"]);
  });
});

describe("scope de las clases de movimiento", () => {
  const movements = [
    mov({ movementClass: "regular", amountCents: 100 }),
    mov({ movementClass: "msi_installment", amountCents: 200 }),
    mov({ movementClass: "msi_purchase", amountCents: 400 }),
    mov({ movementClass: "commission", amountCents: 800 }),
    mov({ movementClass: null, amountCents: 1_600, cardType: "debito" }),
  ];

  const sum = (f: MovementFilter) =>
    filterMovements(movements, f).reduce((n, m) => n + m.amountCents, 0);

  it("por defecto solo el cargo que cuadra con el corte", () => {
    // El débito no tiene clase: se cuela siempre, la clase solo aplica a crédito.
    expect(sum(filter())).toBe(100 + 1_600);
  });

  it("with_msi suma las parcialidades pero no la compra completa", () => {
    expect(sum(filter({ scope: "with_msi" }))).toBe(100 + 200 + 1_600);
  });

  it("all incluye comisiones y la compra MSI, que se cuenta doble", () => {
    expect(sum(filter({ scope: "all" }))).toBe(100 + 200 + 400 + 800 + 1_600);
  });
});

describe("filtros de periodo y monto", () => {
  const movements = [
    mov({ date: "2026-06-30", month: "2026-06", amountCents: 5_000 }),
    mov({ date: "2026-07-10", month: "2026-07", amountCents: 50_000 }),
    mov({ date: null, month: "2026-07", amountCents: 90_000 }),
  ];

  it("el rango de fechas descarta lo que no tiene fecha", () => {
    const result = filterMovements(movements, filter({ from: "2026-07-01" }));

    expect(result.map((m) => m.amountCents)).toEqual([50_000]);
  });

  it("el filtro por mes sí conserva lo que no tiene fecha", () => {
    const result = filterMovements(movements, filter({ month: "2026-07" }));

    expect(result).toHaveLength(2);
  });

  it("los montos se piden en pesos y se comparan en centavos", () => {
    const result = filterMovements(movements, filter({ minAmount: 100 }));

    expect(result.map((m) => m.amountCents)).toEqual([50_000, 90_000]);
  });
});

describe("filtros de tarjeta y persona", () => {
  const movements = [
    mov({ cardName: "BBVA Azul", owner: "Axl" }),
    mov({ cardName: "Nu Oro", owner: "Carlos", cardId: "c2" }),
  ];

  it("la tarjeta se busca por pedazo del nombre", () => {
    expect(filterMovements(movements, filter({ card: "nu" }))).toHaveLength(1);
  });

  it("la persona se busca por pedazo del nombre, sin importar mayúsculas", () => {
    const result = filterMovements(movements, filter({ person: "carl" }));

    expect(result[0].cardName).toBe("Nu Oro");
  });
});

describe("resolveCard", () => {
  const cards = [
    card(),
    card({ id: "22222222-2222-4222-8222-222222222222", name: "BBVA Débito" }),
    card({ id: "33333333-3333-4333-8333-333333333333", name: "Nu Oro" }),
  ];

  it("resuelve por UUID", () => {
    expect(resolveCard(cards, cards[2].id).name).toBe("Nu Oro");
  });

  it("resuelve por nombre parcial", () => {
    expect(resolveCard(cards, "azul").name).toBe("BBVA Azul");
  });

  it("falla en vez de adivinar cuando el nombre es ambiguo", () => {
    expect(() => resolveCard(cards, "BBVA")).toThrow(/varias tarjetas/);
  });

  it("lista las opciones cuando no hay coincidencia", () => {
    expect(() => resolveCard(cards, "Amex")).toThrow(/Nu Oro/);
  });
});
