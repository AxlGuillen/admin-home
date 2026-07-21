import { z } from "zod";

/**
 * Todo monto de este módulo vive en centavos como entero. La aritmética de punto
 * flotante pierde precisión (`0.1 + 0.2 !== 0.3`), y en dinero eso se acumula.
 */
export const currencySchema = z.enum(["MXN", "USD"]);
export type Currency = z.infer<typeof currencySchema>;

export const moneySchema = z.object({
  /** Monto en centavos. Puede ser negativo (un saldo a favor). */
  cents: z.int(),
  currency: currencySchema,
});
export type Money = z.infer<typeof moneySchema>;

export function money(cents: number, currency: Currency = "MXN"): Money {
  return moneySchema.parse({ cents, currency });
}

/**
 * Convierte lo que el usuario teclea a centavos. Acepta separadores de miles y
 * el signo de pesos: "$1,234.50" → 123450.
 *
 * Devuelve `null` si no se puede interpretar, para que el llamador decida qué
 * error mostrar.
 */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[\s$,]/g, "");
  if (cleaned === "" || !/^-?\d*\.?\d*$/.test(cleaned)) return null;

  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;

  return Math.round(value * 100);
}

/** Formatea centavos para la UI: `formatMoney(123450)` → "$1,234.50". */
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
