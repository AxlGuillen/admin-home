import { describe, expect, it } from "vitest";

import {
  clampDay,
  daysUntil,
  lastCutDate,
  nextCutDate,
  nextPaymentDate,
  paymentDateForCut,
  toISODate,
  type CivilDate,
} from "./billing-cycle";

const d = (iso: string): CivilDate => {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
};

describe("clampDay", () => {
  it("ajusta el 31 al último día en meses cortos", () => {
    expect(toISODate(clampDay(2026, 2, 31))).toBe("2026-02-28");
    expect(toISODate(clampDay(2026, 4, 31))).toBe("2026-04-30");
  });

  it("respeta el 29 de febrero en años bisiestos", () => {
    expect(toISODate(clampDay(2028, 2, 31))).toBe("2028-02-29");
  });

  it("no toca días que sí existen", () => {
    expect(toISODate(clampDay(2026, 3, 15))).toBe("2026-03-15");
  });
});

describe("lastCutDate", () => {
  it("usa el mes actual cuando el corte ya pasó", () => {
    expect(toISODate(lastCutDate(5, d("2026-03-20")))).toBe("2026-03-05");
  });

  it("retrocede un mes cuando el corte aún no llega", () => {
    expect(toISODate(lastCutDate(25, d("2026-03-10")))).toBe("2026-02-25");
  });

  it("cuenta el día del corte como ya ocurrido", () => {
    expect(toISODate(lastCutDate(5, d("2026-03-05")))).toBe("2026-03-05");
  });

  it("cruza el fin de año hacia atrás", () => {
    expect(toISODate(lastCutDate(20, d("2026-01-10")))).toBe("2025-12-20");
  });
});

describe("nextCutDate", () => {
  it("avanza al mes siguiente cuando hoy es el corte", () => {
    expect(toISODate(nextCutDate(5, d("2026-03-05")))).toBe("2026-04-05");
  });

  it("cruza el fin de año hacia adelante", () => {
    expect(toISODate(nextCutDate(3, d("2026-12-20")))).toBe("2027-01-03");
  });
});

describe("paymentDateForCut", () => {
  it("paga en el mismo mes cuando el día de pago es mayor que el de corte", () => {
    const cut = d("2026-03-05");
    expect(toISODate(paymentDateForCut(5, 25, cut))).toBe("2026-03-25");
  });

  it("paga el mes siguiente cuando el día de pago es menor que el de corte", () => {
    const cut = d("2026-03-25");
    expect(toISODate(paymentDateForCut(25, 14, cut))).toBe("2026-04-14");
  });

  it("paga el mes siguiente cuando ambos días coinciden", () => {
    const cut = d("2026-03-10");
    expect(toISODate(paymentDateForCut(10, 10, cut))).toBe("2026-04-10");
  });

  it("compara los días configurados, no los ya ajustados por mes corto", () => {
    // Corte 31 en febrero cae el 28, pero el pago 20 sigue siendo de marzo:
    // si comparáramos 20 contra el 28 ajustado seguiríamos llegando a marzo,
    // pero con corte 31 y pago 29 la comparación ingenua fallaría.
    expect(toISODate(paymentDateForCut(31, 20, d("2026-02-28")))).toBe(
      "2026-03-20",
    );
    expect(toISODate(paymentDateForCut(31, 29, d("2026-02-28")))).toBe(
      "2026-03-29",
    );
  });

  it("ajusta el pago cuando cae en un mes corto", () => {
    expect(toISODate(paymentDateForCut(15, 31, d("2026-01-15")))).toBe(
      "2026-01-31",
    );
    expect(toISODate(paymentDateForCut(20, 31, d("2026-01-20")))).toBe(
      "2026-01-31",
    );
  });
});

describe("nextPaymentDate", () => {
  it("devuelve el pago del corte más reciente cuando sigue pendiente", () => {
    // Corte 5 marzo, pago 25 marzo; hoy es 10 de marzo.
    expect(toISODate(nextPaymentDate(5, 25, d("2026-03-10")))).toBe(
      "2026-03-25",
    );
  });

  it("salta al siguiente ciclo cuando el pago del corte anterior ya venció", () => {
    // Hoy 26 de marzo: el pago del 25 ya pasó, toca el del corte del 5 de abril.
    expect(toISODate(nextPaymentDate(5, 25, d("2026-03-26")))).toBe(
      "2026-04-25",
    );
  });

  it("cuenta el día del pago como todavía pendiente", () => {
    expect(toISODate(nextPaymentDate(5, 25, d("2026-03-25")))).toBe(
      "2026-03-25",
    );
  });

  it("funciona cuando el pago cae en el mes siguiente al corte", () => {
    // Corte 25, pago 14. Hoy 1 de abril: el corte del 25 de marzo paga el 14 de abril.
    expect(toISODate(nextPaymentDate(25, 14, d("2026-04-01")))).toBe(
      "2026-04-14",
    );
    // Hoy 20 de abril: ese pago ya venció, toca el corte del 25 de abril → 14 de mayo.
    expect(toISODate(nextPaymentDate(25, 14, d("2026-04-20")))).toBe(
      "2026-05-14",
    );
  });

  it("cruza el fin de año", () => {
    expect(toISODate(nextPaymentDate(25, 14, d("2026-12-26")))).toBe(
      "2027-01-14",
    );
  });
});

describe("daysUntil", () => {
  it("cuenta días hacia adelante", () => {
    expect(daysUntil(d("2026-03-25"), d("2026-03-10"))).toBe(15);
  });

  it("es negativo cuando la fecha ya pasó", () => {
    expect(daysUntil(d("2026-03-01"), d("2026-03-10"))).toBe(-9);
  });

  it("cruza meses y años sin desfase", () => {
    expect(daysUntil(d("2027-01-01"), d("2026-12-25"))).toBe(7);
  });
});
