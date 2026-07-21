import { describe, expect, it } from "vitest";

import {
  clampDay,
  daysUntil,
  lastCutDate,
  nextCutDate,
  nextPaymentDate,
  paymentDateForCut,
  toISODate,
  todayIn,
  type CivilDate,
} from "./billing-cycle";

const d = (iso: string): CivilDate => {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
};

describe("todayIn", () => {
  // The bug this guards: production runs in UTC, so after 6pm Mexico time it thinks it's the next day.
  it("da la fecha local, no la del servidor", () => {
    const nocheEnMexico = new Date("2026-07-21T01:00:00Z"); // 19:00 on the 20th in CDMX

    expect(toISODate(todayIn("America/Mexico_City", nocheEnMexico))).toBe(
      "2026-07-20",
    );
    expect(toISODate(todayIn("UTC", nocheEnMexico))).toBe("2026-07-21");
  });

  it("acierta justo al cambiar de día", () => {
    // 00:30 on the 21st in CDMX = 06:30 UTC on the 21st.
    const recienPasadaMedianoche = new Date("2026-07-21T06:30:00Z");
    expect(
      toISODate(todayIn("America/Mexico_City", recienPasadaMedianoche)),
    ).toBe("2026-07-21");
  });

  it("cruza el fin de año según la zona", () => {
    const anioNuevoUTC = new Date("2027-01-01T03:00:00Z"); // still Dec 31 in CDMX
    expect(toISODate(todayIn("America/Mexico_City", anioNuevoUTC))).toBe(
      "2026-12-31",
    );
    expect(toISODate(todayIn("UTC", anioNuevoUTC))).toBe("2027-01-01");
  });
});

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
    // Cut 31 clamps to Feb 28, but pay 20 is still March; a naive compare against the clamped 28 would break for pay 29.
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
    expect(toISODate(nextPaymentDate(5, 25, d("2026-03-10")))).toBe(
      "2026-03-25",
    );
  });

  it("salta al siguiente ciclo cuando el pago del corte anterior ya venció", () => {
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
    expect(toISODate(nextPaymentDate(25, 14, d("2026-04-01")))).toBe(
      "2026-04-14",
    );
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
