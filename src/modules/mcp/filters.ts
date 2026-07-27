// Las reglas del dominio traducidas a filtros. Aquí está la diferencia con
// `execute_sql` crudo: por defecto "gasto" ya excluye lo que solo mueve dinero
// y lo que se contaría doble.

import { z } from "zod";

import { NON_SPEND } from "@/modules/finance/analytics-core";

import type { LedgerCard, LedgerMovement } from "./ledger";

const MONTH = /^\d{4}-\d{2}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export const movementFilterShape = {
  merchant: z
    .string()
    .optional()
    .describe("Texto contenido en la descripción, sin importar mayúsculas."),
  category: z
    .string()
    .optional()
    .describe(
      "groceries, restaurant, transport, health, shopping, services, subscription, fees, education, other, transfer, income, card_payment, payment, refund.",
    ),
  card: z.string().optional().describe("UUID o parte del nombre de la tarjeta."),
  person: z
    .string()
    .optional()
    .describe("Parte del nombre del dueño de la tarjeta."),
  month: z.string().regex(MONTH).optional().describe("Mes exacto, YYYY-MM."),
  from: z.string().regex(DAY).optional().describe("Desde esta fecha, YYYY-MM-DD."),
  to: z.string().regex(DAY).optional().describe("Hasta esta fecha, YYYY-MM-DD."),
  minAmount: z.number().nonnegative().optional().describe("Monto mínimo en pesos."),
  maxAmount: z.number().nonnegative().optional().describe("Monto máximo en pesos."),
  flow: z
    .enum(["out", "in", "all"])
    .default("out")
    .describe("out = sale dinero (gasto), in = entra (ingreso, pago, devolución)."),
  scope: z
    .enum(["regular", "with_msi", "all"])
    .default("regular")
    .describe(
      "regular = solo el cargo que cuadra con el corte. with_msi suma las parcialidades de meses sin intereses. all incluye además comisiones y la compra MSI completa, que se cuenta doble con sus parcialidades.",
    ),
  includeMoneyMoves: z
    .boolean()
    .default(false)
    .describe(
      "Incluye transferencias, pagos de tarjeta e ingresos, que mueven dinero pero no lo gastan. Se ignora si flow no es out o si se pidió una categoría explícita.",
    ),
};

export const movementFilterSchema = z.object(movementFilterShape);
export type MovementFilter = z.infer<typeof movementFilterSchema>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const inScope = (movementClass: string | null, scope: MovementFilter["scope"]) => {
  if (scope === "all" || movementClass === null) return true;
  if (movementClass === "regular") return true;
  return scope === "with_msi" && movementClass === "msi_installment";
};

export function filterMovements(
  movements: LedgerMovement[],
  filter: MovementFilter,
): LedgerMovement[] {
  const merchant = filter.merchant?.toUpperCase();
  const person = filter.person?.toUpperCase();
  const card = filter.card?.toLowerCase();
  const min = filter.minAmount === undefined ? null : filter.minAmount * 100;
  const max = filter.maxAmount === undefined ? null : filter.maxAmount * 100;
  const hideMoneyMoves =
    !filter.includeMoneyMoves && filter.flow === "out" && !filter.category;

  return movements.filter((m) => {
    if (filter.flow !== "all" && m.flow !== filter.flow) return false;
    if (!inScope(m.movementClass, filter.scope)) return false;
    if (hideMoneyMoves && NON_SPEND.has(m.category ?? "other")) return false;
    if (filter.category && (m.category ?? "other") !== filter.category) return false;
    if (merchant && !m.description.toUpperCase().includes(merchant)) return false;
    if (person && !(m.owner ?? "").toUpperCase().includes(person)) return false;
    if (card && m.cardId !== filter.card && !m.cardName.toLowerCase().includes(card))
      return false;
    if (filter.month && m.month !== filter.month) return false;
    if (filter.from && (!m.date || m.date < filter.from)) return false;
    if (filter.to && (!m.date || m.date > filter.to)) return false;
    if (min !== null && m.amountCents < min) return false;
    if (max !== null && m.amountCents > max) return false;
    return true;
  });
}

/** Acepta el UUID o un pedazo del nombre; falla si el nombre es ambiguo. */
export function resolveCard(cards: LedgerCard[], query: string): LedgerCard {
  if (UUID.test(query)) {
    const byId = cards.find((c) => c.id === query);
    if (byId) return byId;
    throw new Error(`No hay ninguna tarjeta con id ${query}.`);
  }

  const needle = query.toLowerCase();
  const matches = cards.filter((c) => c.name.toLowerCase().includes(needle));
  if (matches.length === 1) return matches[0];
  if (matches.length === 0) {
    throw new Error(
      `No hay tarjeta que coincida con "${query}". Disponibles: ${cards.map((c) => c.name).join(", ")}.`,
    );
  }
  throw new Error(
    `"${query}" coincide con varias tarjetas: ${matches.map((c) => c.name).join(", ")}.`,
  );
}
