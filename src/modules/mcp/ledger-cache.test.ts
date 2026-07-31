import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cachedByHousehold, resetLedgerCache, type Ledger } from "./ledger";

const ledgerFor = (household: string): Ledger => ({
  cards: [],
  people: [household],
  movements: [],
  loadedAt: "2026-01-01T00:00:00.000Z",
});

beforeEach(() => {
  resetLedgerCache();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("caché del ledger", () => {
  // El invariante de seguridad: una instancia de Node se reutiliza entre requests
  // de usuarios distintos, y RLS protege el fetch pero no la memoria. Sin clave,
  // el segundo hogar en llegar recibiría el ledger del primero.
  it("nunca sirve el ledger de un hogar a otro", async () => {
    const load = vi.fn((household: string) => async () => ledgerFor(household));

    const casa = await cachedByHousehold("hogar-a", load("hogar-a"));
    const otra = await cachedByHousehold("hogar-b", load("hogar-b"));

    expect(casa.people).toEqual(["hogar-a"]);
    expect(otra.people).toEqual(["hogar-b"]);
  });

  it("reusa la carga dentro del TTL", async () => {
    const load = vi.fn(async () => ledgerFor("hogar-a"));

    await cachedByHousehold("hogar-a", load);
    vi.advanceTimersByTime(59_000);
    await cachedByHousehold("hogar-a", load);

    expect(load).toHaveBeenCalledTimes(1);
  });

  it("recarga pasado el TTL", async () => {
    const load = vi.fn(async () => ledgerFor("hogar-a"));

    await cachedByHousehold("hogar-a", load);
    vi.advanceTimersByTime(61_000);
    await cachedByHousehold("hogar-a", load);

    expect(load).toHaveBeenCalledTimes(2);
  });

  it("colapsa las llamadas concurrentes en una sola carga", async () => {
    // El LLM dispara varias herramientas a la vez; sin guardar la promesa serían
    // tres cargas de ~2,000 filas para la misma pregunta.
    const load = vi.fn(async () => ledgerFor("hogar-a"));

    await Promise.all([
      cachedByHousehold("hogar-a", load),
      cachedByHousehold("hogar-a", load),
      cachedByHousehold("hogar-a", load),
    ]);

    expect(load).toHaveBeenCalledTimes(1);
  });

  it("no cachea el error: el siguiente intento vuelve a cargar", async () => {
    const load = vi
      .fn<() => Promise<Ledger>>()
      .mockRejectedValueOnce(new Error("se cayó la red"))
      .mockResolvedValueOnce(ledgerFor("hogar-a"));

    await expect(cachedByHousehold("hogar-a", load)).rejects.toThrow("se cayó la red");
    await expect(cachedByHousehold("hogar-a", load)).resolves.toMatchObject({
      people: ["hogar-a"],
    });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("no crece sin límite", async () => {
    const load = (h: string) => async () => ledgerFor(h);
    for (const h of ["a", "b", "c", "d", "e", "f"]) {
      await cachedByHousehold(h, load(h));
    }

    // El más viejo ya salió, así que vuelve a cargar.
    const reload = vi.fn(load("a"));
    await cachedByHousehold("a", reload);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
