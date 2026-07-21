import { describe, expect, it } from "vitest";

import { cardInputSchema } from "./schemas";

/** Lo que llega de un `<form>`: puro string, y los vacíos como "". */
function form(fields: Record<string, string | undefined>) {
  return cardInputSchema.safeParse(fields);
}

const CREDIT: Record<string, string | undefined> = {
  type: "credito",
  name: "Nu crédito",
  description: "",
  issuer: "",
  lastFour: "",
  color: "",
  cutDay: "5",
  paymentDay: "25",
};

describe("cardInputSchema", () => {
  it("convierte los días a número y los vacíos a null", () => {
    const result = form(CREDIT);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.cutDay).toBe(5);
    expect(result.data.paymentDay).toBe(25);
    expect(result.data.description).toBeNull();
    expect(result.data.issuer).toBeNull();
    expect(result.data.lastFour).toBeNull();
    expect(result.data.color).toBeNull();
  });

  it("trata un campo ausente igual que uno vacío", () => {
    const withoutOptionals = { ...CREDIT };
    delete withoutOptionals.description;
    delete withoutOptionals.issuer;

    const result = form(withoutOptionals);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.description).toBeNull();
    expect(result.data.issuer).toBeNull();
  });

  it("acepta dueño vacío y valida que sea uuid cuando viene", () => {
    const noOwner = form(CREDIT);
    expect(noOwner.success && noOwner.data.ownerPersonId).toBeNull();

    const withOwner = form({
      ...CREDIT,
      ownerPersonId: "c18ef35d-df06-4e4a-82dc-ace24e2b051d",
    });
    expect(withOwner.success && withOwner.data.ownerPersonId).toBe(
      "c18ef35d-df06-4e4a-82dc-ace24e2b051d",
    );

    expect(form({ ...CREDIT, ownerPersonId: "Axl" }).success).toBe(false);
  });

  it("recorta espacios del nombre", () => {
    const result = form({ ...CREDIT, name: "  Nu  " });
    expect(result.success && result.data.name).toBe("Nu");
  });

  it("rechaza un nombre en blanco", () => {
    const result = form({ ...CREDIT, name: "   " });
    expect(result.success).toBe(false);
  });

  it("exige ciclo en las tarjetas de crédito", () => {
    const result = form({ ...CREDIT, cutDay: "", paymentDay: "" });
    expect(result.success).toBe(false);
    if (result.success) return;

    const paths = result.error.issues.map((i) => i.path.join("."));
    expect(paths).toContain("cutDay");
    expect(paths).toContain("paymentDay");
  });

  it("limpia el ciclo en débito aunque el formulario lo mande", () => {
    // Pasa si el usuario llenó los días y luego cambió el tipo a débito.
    const result = form({ ...CREDIT, type: "debito" });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.cutDay).toBeNull();
    expect(result.data.paymentDay).toBeNull();
  });

  it("rechaza días fuera del 1-31", () => {
    expect(form({ ...CREDIT, cutDay: "0" }).success).toBe(false);
    expect(form({ ...CREDIT, cutDay: "32" }).success).toBe(false);
    expect(form({ ...CREDIT, cutDay: "5.5" }).success).toBe(false);
    expect(form({ ...CREDIT, cutDay: "abc" }).success).toBe(false);
  });

  it("acepta los extremos del día", () => {
    expect(form({ ...CREDIT, cutDay: "1", paymentDay: "31" }).success).toBe(true);
  });

  it("exige exactamente 4 dígitos en lastFour", () => {
    expect(form({ ...CREDIT, lastFour: "1234" }).success).toBe(true);
    expect(form({ ...CREDIT, lastFour: "123" }).success).toBe(false);
    expect(form({ ...CREDIT, lastFour: "12345" }).success).toBe(false);
    expect(form({ ...CREDIT, lastFour: "12a4" }).success).toBe(false);
  });

  it("solo acepta color hexadecimal de 6 dígitos", () => {
    expect(form({ ...CREDIT, color: "#3b82f6" }).success).toBe(true);
    expect(form({ ...CREDIT, color: "3b82f6" }).success).toBe(false);
    expect(form({ ...CREDIT, color: "#fff" }).success).toBe(false);
    expect(form({ ...CREDIT, color: "red" }).success).toBe(false);
  });

  it("rechaza un tipo desconocido", () => {
    expect(form({ ...CREDIT, type: "prepago" }).success).toBe(false);
  });

  describe("límite de crédito", () => {
    const limit = (value: string | undefined) => {
      const result = form({ ...CREDIT, creditLimitCents: value });
      return result.success ? result.data.creditLimitCents : "error";
    };

    it("convierte pesos tecleados a centavos", () => {
      expect(limit("50000")).toBe(5_000_000);
      expect(limit("50000.50")).toBe(5_000_050);
      expect(limit("$50,000.00")).toBe(5_000_000);
    });

    it("vacío es null, no cero", () => {
      expect(limit("")).toBeNull();
      expect(limit(undefined)).toBeNull();
    });

    it("un monto ilegible falla en vez de guardarse como sin límite", () => {
      // El riesgo real: que "abc" se volviera null y la tarjeta quedara sin
      // límite en silencio, en vez de avisarle al usuario.
      expect(limit("abc")).toBe("error");
    });

    it("rechaza cero y negativos", () => {
      expect(limit("0")).toBe("error");
      expect(limit("-100")).toBe("error");
    });

    it("se limpia en débito, que no tiene línea de crédito", () => {
      const result = form({
        ...CREDIT,
        type: "debito",
        creditLimitCents: "50000",
      });
      expect(result.success && result.data.creditLimitCents).toBeNull();
    });
  });
});
