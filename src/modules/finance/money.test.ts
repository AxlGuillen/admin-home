import { describe, expect, it } from "vitest";

import { formatMoney, parseMoney } from "./money";

describe("parseMoney", () => {
  it("convierte decimales a centavos", () => {
    expect(parseMoney("1234.50")).toBe(123450);
    expect(parseMoney("0.01")).toBe(1);
    expect(parseMoney("100")).toBe(10000);
  });

  it("tolera formato de la UI mexicana", () => {
    expect(parseMoney("$1,234.50")).toBe(123450);
    expect(parseMoney(" 1 234.50 ")).toBe(123450);
  });

  it("acepta montos negativos (saldo a favor)", () => {
    expect(parseMoney("-500.25")).toBe(-50025);
  });

  it("redondea el tercer decimal en vez de truncarlo", () => {
    expect(parseMoney("10.005")).toBe(1001);
  });

  it("devuelve null cuando no es un monto", () => {
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("abc")).toBeNull();
    expect(parseMoney("12.34.56")).toBeNull();
  });
});

describe("formatMoney", () => {
  it("formatea centavos como pesos", () => {
    // Intl usa espacio no separable en algunos runtimes; normalizamos.
    expect(formatMoney(123450).replace(/ /g, " ")).toBe("$1,234.50");
  });

  it("respeta la moneda", () => {
    expect(formatMoney(100, "USD", "en-US")).toBe("$1.00");
  });
});
