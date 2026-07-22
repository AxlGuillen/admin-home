"use client";

import Link from "next/link";
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { Kpi, Panel } from "@/components/blueprint";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import type { FinanceOverview } from "../analytics";
import { CATEGORY_COLORS, CATEGORY_LABELS, monthLabel } from "../categories";
import { formatMoney } from "../money";

const pesos = (cents: number) => formatMoney(cents);

export function FinanceOverviewDashboard({ data }: { data: FinanceOverview }) {
  const { totals } = data;
  const utilizationPct =
    totals.limitCents > 0
      ? Math.round((totals.currentDebtCents / totals.limitCents) * 100)
      : null;

  const categoryData = data.byCategory.map((c, i) => ({
    ...c,
    label: CATEGORY_LABELS[c.category] ?? c.category,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const categoryConfig: ChartConfig = Object.fromEntries(
    categoryData.map((c) => [c.category, { label: c.label, color: c.fill }]),
  );

  const monthData = data.byMonth.map((m) => ({
    ...m,
    label: monthLabel(m.month),
  }));

  return (
    <div className="space-y-4.5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Gasto total"
          value={pesos(totals.spendCents)}
          hint={`${data.byMonth.length} meses`}
        />
        <Kpi
          label="Costo del crédito"
          value={pesos(totals.creditCostCents)}
          hint="Intereses + comisiones + IVA"
          tone="danger"
        />
        <Kpi
          label="Deuda actual"
          value={pesos(totals.currentDebtCents)}
          hint={
            utilizationPct !== null ? `${utilizationPct}% del límite` : undefined
          }
        />
        <Kpi
          label="Suscripciones / mes"
          value={pesos(totals.subscriptionsPerMonthCents)}
          hint={`${data.subscriptions.length} activas`}
        />
      </div>

      <div className="grid gap-4.5 lg:grid-cols-2">
        <Panel
          title="Gasto por categoría"
          subtitle="Consumo del hogar, todos los meses."
        >
          <ChartContainer
            config={categoryConfig}
            className="mx-auto aspect-square max-h-[260px]"
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name) => (
                      <div className="flex w-full justify-between gap-3">
                        <span>{CATEGORY_LABELS[String(name)] ?? name}</span>
                        <span className="font-mono">{pesos(Number(value))}</span>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={categoryData}
                dataKey="amount"
                nameKey="category"
                innerRadius={64}
                strokeWidth={2}
              >
                {categoryData.map((c) => (
                  <Cell key={c.category} fill={c.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
            {categoryData.slice(0, 6).map((c) => (
              <div key={c.category} className="flex items-center gap-1.5">
                <span className="size-2.5" style={{ background: c.fill }} />
                {c.label}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Gasto por mes" subtitle="Cargos regulares del hogar.">
          <ChartContainer
            config={{ spend: { label: "Gasto", color: "var(--cat-1)" } }}
            className="max-h-[260px] w-full"
          >
            <BarChart data={monthData} accessibilityLayer>
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis hide />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="font-mono">{pesos(Number(value))}</span>
                    )}
                  />
                }
              />
              <Bar dataKey="spend" fill="var(--cat-1)" />
            </BarChart>
          </ChartContainer>
        </Panel>
      </div>

      <div className="grid gap-4.5 lg:grid-cols-2">
        <Panel
          title="Utilización por tarjeta"
          subtitle="Deuda actual vs. límite de crédito."
        >
          <div className="space-y-4">
            {data.utilization.map((u) => {
              const pct =
                u.limitCents && u.limitCents > 0
                  ? Math.round((u.debtCents / u.limitCents) * 100)
                  : null;
              return (
                <div key={u.cardId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <Link
                      href={`/finance/${u.cardId}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: u.color ?? "var(--cat-1)" }}
                      />
                      {u.name}
                    </Link>
                    <span className="text-muted-foreground tabular-nums">
                      {pesos(u.debtCents)}
                      {u.limitCents ? ` / ${pesos(u.limitCents)}` : ""}
                    </span>
                  </div>
                  {pct !== null && (
                    <div className="h-2 w-full overflow-hidden bg-[color-mix(in_srgb,var(--ink)_10%,transparent)]">
                      <div
                        className={`h-full ${pct >= 80 ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel
          title="Fugas de capital"
          subtitle="Suscripciones recurrentes y costo del crédito."
        >
          <div className="space-y-2.5">
            {data.subscriptions.slice(0, 6).map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between text-[13px]"
              >
                <span className="flex items-center gap-2">
                  {s.name}
                  {s.cards.length > 1 && (
                    <Badge variant="destructive" className="text-[10px]">
                      {s.cards.length} tarjetas
                    </Badge>
                  )}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {pesos(s.perMonthCents)}/mes
                </span>
              </div>
            ))}
          </div>
          {data.fees.length > 0 && (
            <div className="border-divider mt-3.5 space-y-2 border-t pt-3">
              {data.fees.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center justify-between text-[13px]"
                >
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="text-destructive tabular-nums">
                    {pesos(f.cents)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
