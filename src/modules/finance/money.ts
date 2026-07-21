import { z } from "zod";

// Amounts are integer cents: float arithmetic loses precision (0.1 + 0.2 !== 0.3) and it accumulates in money.
export const currencySchema = z.enum(["MXN", "USD"]);
export type Currency = z.infer<typeof currencySchema>;

export const moneySchema = z.object({
  /** Cents. Can be negative (a credit balance). */
  cents: z.int(),
  currency: currencySchema,
});
export type Money = z.infer<typeof moneySchema>;

export function money(cents: number, currency: Currency = "MXN"): Money {
  return moneySchema.parse({ cents, currency });
}

// Returns null when unparseable so the caller decides which error to show.
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[\s$,]/g, "");
  if (cleaned === "" || !/^-?\d*\.?\d*$/.test(cleaned)) return null;

  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;

  return Math.round(value * 100);
}

export function formatMoney(
  cents: number,
  currency: Currency = "MXN",
  locale = "es-MX",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}
