import { afterEach, describe, expect, it, vi } from "vitest";

import { hasSeenTour, markTourSeen } from "./tour-storage";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("tour-storage", () => {
  it("una pantalla nueva no está vista", () => {
    expect(hasSeenTour("inicio")).toBe(false);
  });

  it("marcar y preguntar es un roundtrip", () => {
    markTourSeen("inicio");
    expect(hasSeenTour("inicio")).toBe(true);
    expect(hasSeenTour("finanzas")).toBe(false);
  });

  it("subir la versión re-muestra el tour", () => {
    markTourSeen("inicio", 1);
    expect(hasSeenTour("inicio", 2)).toBe(false);
  });

  it("sin storage calla el tour en vez de repetirlo cada visita", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(hasSeenTour("inicio")).toBe(true);
  });

  it("marcar sin storage no revienta", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(() => markTourSeen("inicio")).not.toThrow();
  });
});
