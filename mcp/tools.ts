import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  computeCardDetail,
  computeDuplicates,
  computeRecurring,
  computeFinanceOverview,
  fetchCardDetailRows,
  fetchOverviewRows,
  merchantKey,
} from "@/modules/finance/analytics-core";

import { openSession, type Session } from "./client";
import { filterMovements, movementFilterShape, resolveCard } from "./filters";
import { getLedger, type Ledger } from "./ledger";
import { byCategory, byMonth, pesos, toRow, totals } from "./summarize";

// El access token dura una hora; renovar cada 45 minutos evita que una consulta
// falle a media conversación sin depender del timer interno de supabase-js.
const SESSION_TTL_MS = 45 * 60_000;
let memo: { at: number; session: Promise<Session> } | null = null;

function session(): Promise<Session> {
  if (memo && Date.now() - memo.at < SESSION_TTL_MS) return memo.session;
  const opened = openSession();
  memo = { at: Date.now(), session: opened };
  opened.catch(() => {
    memo = null;
  });
  return opened;
}

type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

function handler<A>(
  run: (args: A, ctx: Session, ledger: Ledger) => unknown | Promise<unknown>,
) {
  return async (args: A): Promise<ToolResult> => {
    try {
      const ctx = await session();
      const ledger = await getLedger(ctx.client);
      const value = await run(args, ctx, ledger);
      return { content: [{ type: "text", text: JSON.stringify(value) }] };
    } catch (error) {
      return {
        isError: true,
        content: [
          { type: "text", text: error instanceof Error ? error.message : String(error) },
        ],
      };
    }
  };
}

const MONEY_NOTE = "Todos los montos van en pesos mexicanos.";

const readOnly = { readOnlyHint: true, openWorldHint: false } as const;

export function registerTools(server: McpServer): void {
  server.registerTool(
    "list_cards",
    {
      title: "Tarjetas del hogar",
      description: `Tarjetas de crédito y débito con su dueño, ciclo de facturación, límite y qué meses de estados de cuenta hay cargados. Empieza por aquí: la cobertura dice de qué periodo se puede responder con datos y de cuál no. ${MONEY_NOTE}`,
      inputSchema: {
        includeArchived: z.boolean().default(false),
      },
      annotations: readOnly,
    },
    handler<{ includeArchived: boolean }>((args, _ctx, ledger) => {
      const cards = ledger.cards.filter((c) => args.includeArchived || !c.archived);

      return {
        cards: cards.map((card) => {
          const own = ledger.movements.filter((m) => m.cardId === card.id);
          const months = [...new Set(own.map((m) => m.month))].filter(Boolean).sort();
          return {
            id: card.id,
            name: card.name,
            issuer: card.issuer,
            lastFour: card.lastFour,
            type: card.type,
            owner: card.owner,
            cutDay: card.cutDay,
            paymentDay: card.paymentDay,
            creditLimit: card.creditLimitCents ? pesos(card.creditLimitCents) : null,
            archived: card.archived,
            coverage: {
              from: months[0] ?? null,
              to: months[months.length - 1] ?? null,
              months: months.length,
              movements: own.length,
            },
          };
        }),
        people: ledger.people,
      };
    }),
  );

  server.registerTool(
    "get_household_overview",
    {
      title: "Panorama del hogar",
      description: `Totales consolidados: gasto acumulado, costo del crédito (intereses, comisiones e IVA), deuda actual, utilización por tarjeta, saldo de débito, suscripciones y serie mensual. La deuda sale del último corte de cada tarjeta, no de la suma de todos. ${MONEY_NOTE}`,
      inputSchema: {},
      annotations: readOnly,
    },
    handler<Record<string, never>>(async (_args, ctx) => {
      const overview = computeFinanceOverview(await fetchOverviewRows(ctx.client));
      const { totals: t } = overview;

      return {
        totals: {
          spend: pesos(t.spendCents),
          creditCost: pesos(t.creditCostCents),
          interest: pesos(t.interestCents),
          fees: pesos(t.feesCents),
          currentDebt: pesos(t.currentDebtCents),
          creditLimit: pesos(t.limitCents),
          utilizationPct: t.limitCents
            ? Math.round((t.currentDebtCents / t.limitCents) * 1000) / 10
            : null,
          debitBalance:
            t.debitBalanceCents === null ? null : pesos(t.debitBalanceCents),
          subscriptionsPerMonth: pesos(t.subscriptionsPerMonthCents),
        },
        byMonth: overview.byMonth.map((m) => ({
          month: m.month,
          spend: pesos(m.spend),
          creditCost: pesos(m.cost),
        })),
        byCategory: overview.byCategory.map((c) => ({
          category: c.category,
          total: pesos(c.amount),
        })),
        cards: overview.utilization.map((u) => ({
          card: u.name,
          debt: pesos(u.debtCents),
          limit: u.limitCents ? pesos(u.limitCents) : null,
          utilizationPct: u.limitCents
            ? Math.round((u.debtCents / u.limitCents) * 1000) / 10
            : null,
        })),
        subscriptions: overview.subscriptions.map((s) => ({
          name: s.name,
          months: s.months,
          perMonth: pesos(s.perMonthCents),
          total: pesos(s.totalCents),
          cards: s.cards,
        })),
        fees: overview.fees.map((f) => ({
          label: f.label,
          total: pesos(f.cents),
          count: f.count,
        })),
      };
    }),
  );

  server.registerTool(
    "get_card_detail",
    {
      title: "Detalle de una tarjeta",
      description: `Una tarjeta a fondo: mes a mes, gasto por categoría, suscripciones, comercios recurrentes y cobros duplicados. No devuelve la lista de movimientos: para eso está search_movements con el filtro card. ${MONEY_NOTE}`,
      inputSchema: {
        card: z.string().describe("UUID o parte del nombre de la tarjeta."),
      },
      annotations: readOnly,
    },
    handler<{ card: string }>(async (args, ctx, ledger) => {
      const target = resolveCard(ledger.cards, args.card);
      const rows = await fetchCardDetailRows(ctx.client, target.id);
      if (!rows) throw new Error(`No se pudo leer la tarjeta ${target.name}.`);
      const detail = computeCardDetail(rows);

      return {
        card: {
          name: detail.card.name,
          issuer: detail.card.issuer,
          type: detail.card.isCredit ? "credito" : "debito",
          owner: target.owner,
          cutDay: target.cutDay,
          paymentDay: target.paymentDay,
        },
        totals: {
          balance:
            detail.totals.balanceCents === null
              ? null
              : pesos(detail.totals.balanceCents),
          creditLimit: detail.totals.limitCents
            ? pesos(detail.totals.limitCents)
            : null,
          spend: pesos(detail.totals.spendCents),
          inflow: pesos(detail.totals.inflowCents),
          creditCost: pesos(detail.totals.costCents),
        },
        months: detail.months.map((m) => ({
          month: m.month,
          spend: pesos(m.spendCents),
          inflow: pesos(m.inflowCents),
          balance: m.balanceCents === null ? null : pesos(m.balanceCents),
          creditCost: pesos(m.costCents),
        })),
        byCategory: detail.byCategory.map((c) => ({
          category: c.category,
          total: pesos(c.amount),
        })),
        subscriptions: detail.subscriptions.map((s) => ({
          name: s.name,
          months: s.months,
          perMonth: pesos(s.perMonthCents),
        })),
        recurring: detail.recurring.slice(0, 15).map((r) => ({
          merchant: r.name,
          months: r.months,
          charges: r.count,
          total: pesos(r.totalCents),
          perMonth: pesos(r.perMonthCents),
        })),
        duplicates: detail.duplicates.slice(0, 15).map((d) => ({
          merchant: d.description,
          amount: pesos(d.amountCents),
          dates: d.dates,
        })),
        movementCount: detail.movements.length,
      };
    }),
  );

  const searchShape = {
    ...movementFilterShape,
    sort: z.enum(["date", "amount"]).default("date"),
    limit: z.number().int().min(1).max(200).default(20),
  };
  type SearchArgs = z.infer<z.ZodObject<typeof searchShape>>;

  server.registerTool(
    "search_movements",
    {
      title: "Buscar movimientos",
      description: `Movimientos filtrados por comercio, categoría, tarjeta, persona, fecha o monto. Devuelve SIEMPRE el agregado (cuántos, cuánto suman, cómo se reparten por mes) y solo los primeros \`limit\` movimientos, ordenados por fecha o por monto. Para el cargo más caro usa sort=amount. ${MONEY_NOTE}`,
      inputSchema: searchShape,
      annotations: readOnly,
    },
    handler<SearchArgs>((args, _ctx, ledger) => {
      const found = filterMovements(ledger.movements, args);
      const sorted = [...found].sort((a, b) =>
        args.sort === "amount"
          ? b.amountCents - a.amountCents
          : (b.date ?? "").localeCompare(a.date ?? ""),
      );

      return {
        ...totals(found),
        byMonth: byMonth(found),
        byCategory: byCategory(found).slice(0, 8),
        movements: sorted.slice(0, args.limit).map(toRow),
        hasMore: found.length > args.limit,
      };
    }),
  );

  server.registerTool(
    "spending_by_category",
    {
      title: "Gasto por categoría",
      description: `Reparto del gasto por categoría en el periodo y con los filtros que se pidan, con su porcentaje del total. ${MONEY_NOTE}`,
      inputSchema: movementFilterShape,
      annotations: readOnly,
    },
    handler<z.infer<z.ZodObject<typeof movementFilterShape>>>(
      (args, _ctx, ledger) => {
        const found = filterMovements(ledger.movements, args);
        return { ...totals(found), categories: byCategory(found) };
      },
    ),
  );

  server.registerTool(
    "spending_by_month",
    {
      title: "Gasto por mes",
      description: `Serie mensual del gasto con la categoría dominante de cada mes. Sirve para ver si algo se disparó y desde cuándo. ${MONEY_NOTE}`,
      inputSchema: movementFilterShape,
      annotations: readOnly,
    },
    handler<z.infer<z.ZodObject<typeof movementFilterShape>>>(
      (args, _ctx, ledger) => {
        const found = filterMovements(ledger.movements, args);
        const months = byMonth(found).map((m) => {
          const top = byCategory(found.filter((x) => x.month === m.month))[0];
          return {
            ...m,
            topCategory: top ? { category: top.category, total: top.total } : null,
          };
        });

        return {
          ...totals(found),
          averagePerMonth: months.length
            ? Math.round((months.reduce((n, m) => n + m.total, 0) / months.length) * 100) /
              100
            : 0,
          months,
        };
      },
    ),
  );

  const recurringShape = {
    ...movementFilterShape,
    minMonths: z
      .number()
      .int()
      .min(2)
      .default(3)
      .describe("Meses distintos en los que debe aparecer el comercio."),
    limit: z.number().int().min(1).max(100).default(20),
  };
  type RecurringArgs = z.infer<z.ZodObject<typeof recurringShape>>;

  server.registerTool(
    "find_recurring_merchants",
    {
      title: "Comercios recurrentes",
      description: `Comercios que cobran mes tras mes, normalizando el prefijo del procesador de pago y el número de sucursal ("MERPAGO*X", "FAR GUAD 1608"). Encuentra el goteo que la lista de suscripciones no ve porque el cargo no está categorizado como tal. ${MONEY_NOTE}`,
      inputSchema: recurringShape,
      annotations: readOnly,
    },
    handler<RecurringArgs>((args, _ctx, ledger) => {
      const found = filterMovements(ledger.movements, args);
      const seen = new Map<string, { last: string | null; cards: Set<string> }>();
      for (const m of found) {
        const key = merchantKey(m.description);
        const entry = seen.get(key) ?? { last: null, cards: new Set<string>() };
        if (m.date && (!entry.last || m.date > entry.last)) entry.last = m.date;
        entry.cards.add(m.cardName);
        seen.set(key, entry);
      }

      return {
        merchants: computeRecurring(found, args.minMonths)
          .slice(0, args.limit)
          .map((r) => ({
            merchant: r.name,
            months: r.months,
            charges: r.count,
            total: pesos(r.totalCents),
            perMonth: pesos(r.perMonthCents),
            lastSeen: seen.get(r.name)?.last ?? null,
            cards: [...(seen.get(r.name)?.cards ?? [])],
          })),
      };
    }),
  );

  const duplicatesShape = {
    ...movementFilterShape,
    withinDays: z
      .number()
      .int()
      .min(1)
      .max(31)
      .default(3)
      .describe("Ventana en días entre dos cargos idénticos."),
    limit: z.number().int().min(1).max(100).default(20),
  };
  type DuplicatesArgs = z.infer<z.ZodObject<typeof duplicatesShape>>;

  server.registerTool(
    "find_duplicate_charges",
    {
      title: "Cobros duplicados",
      description: `Mismo comercio y mismo monto dos o más veces dentro de una ventana de días: candidatos a cobro doble. Son sospechas, no certezas — una gasolinera dos veces en la semana es normal. ${MONEY_NOTE}`,
      inputSchema: duplicatesShape,
      annotations: readOnly,
    },
    handler<DuplicatesArgs>((args, _ctx, ledger) => {
      const found = filterMovements(ledger.movements, args);
      const cardsFor = new Map<string, Set<string>>();
      for (const m of found) {
        const key = `${merchantKey(m.description)}|${m.amountCents}`;
        cardsFor.set(key, (cardsFor.get(key) ?? new Set<string>()).add(m.cardName));
      }

      return {
        duplicates: computeDuplicates(found, args.withinDays)
          .slice(0, args.limit)
          .map((d) => ({
            merchant: d.description,
            amount: pesos(d.amountCents),
            times: d.dates.length,
            dates: d.dates,
            cards: [...(cardsFor.get(`${d.description}|${d.amountCents}`) ?? [])],
          })),
      };
    }),
  );
}
