// Agregaciones sobre el libro mayor ya filtrado. Todo lo que sale de aquí va en
// PESOS, no en centavos: el LLM lee el número tal cual y "12345" en centavos se
// convierte en una respuesta con dos órdenes de magnitud de más.

import type { LedgerMovement } from "./ledger";

export const pesos = (cents: number) => Math.round(cents) / 100;

export type Totals = {
  count: number;
  total: number;
  average: number;
  largest: number;
};

export function totals(movements: LedgerMovement[]): Totals {
  const cents = movements.reduce((n, m) => n + m.amountCents, 0);
  return {
    count: movements.length,
    total: pesos(cents),
    average: pesos(movements.length ? cents / movements.length : 0),
    largest: pesos(Math.max(0, ...movements.map((m) => m.amountCents))),
  };
}

function tally<T>(
  movements: LedgerMovement[],
  key: (m: LedgerMovement) => T,
): Map<T, { cents: number; count: number }> {
  const map = new Map<T, { cents: number; count: number }>();
  for (const m of movements) {
    const k = key(m);
    const entry = map.get(k) ?? { cents: 0, count: 0 };
    entry.cents += m.amountCents;
    entry.count += 1;
    map.set(k, entry);
  }
  return map;
}

export type CategoryTotal = {
  category: string;
  total: number;
  count: number;
  share: number;
};

export function byCategory(movements: LedgerMovement[]): CategoryTotal[] {
  const all = movements.reduce((n, m) => n + m.amountCents, 0) || 1;
  return [...tally(movements, (m) => m.category ?? "other")]
    .map(([category, e]) => ({
      category,
      total: pesos(e.cents),
      count: e.count,
      share: Math.round((e.cents / all) * 1000) / 10,
    }))
    .sort((a, b) => b.total - a.total);
}

export type MonthTotal = { month: string; total: number; count: number };

export function byMonth(movements: LedgerMovement[]): MonthTotal[] {
  return [...tally(movements, (m) => m.month)]
    .map(([month, e]) => ({ month, total: pesos(e.cents), count: e.count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export type CardTotal = { card: string; owner: string | null; total: number; count: number };

export function byCard(movements: LedgerMovement[]): CardTotal[] {
  const owner = new Map(movements.map((m) => [m.cardName, m.owner]));
  return [...tally(movements, (m) => m.cardName)]
    .map(([card, e]) => ({
      card,
      owner: owner.get(card) ?? null,
      total: pesos(e.cents),
      count: e.count,
    }))
    .sort((a, b) => b.total - a.total);
}

export type MovementRow = {
  date: string | null;
  description: string;
  amount: number;
  category: string;
  card: string;
  owner: string | null;
  flow: "in" | "out";
  class?: string;
};

export function toRow(m: LedgerMovement): MovementRow {
  return {
    date: m.date,
    description: m.description,
    amount: pesos(m.amountCents),
    category: m.category ?? "other",
    card: m.cardName,
    owner: m.owner,
    flow: m.flow,
    ...(m.movementClass && m.movementClass !== "regular"
      ? { class: m.movementClass }
      : {}),
  };
}
