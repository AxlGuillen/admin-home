"use client";

import Link from "next/link";
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";

import { formatMoney } from "../money";
import type { FinanceOverview } from "../analytics";
import { CATEGORY_COLORS, CATEGORY_LABELS, monthLabel } from "../categories";

const pesos = (cents: number) => formatMoney(cents);

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "danger";
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={`text-2xl ${tone === "danger" ? "text-destructive" : ""}`}
        >
          {value}
        </CardTitle>
      </CardHeader>
      {hint && (
        <CardContent className="text-muted-foreground pt-0 text-xs">
          {hint}
        </CardContent>
      )}
    </Card>
  );
}

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
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Gasto total (histórico)"
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
          hint={utilizationPct !== null ? `${utilizationPct}% del límite` : undefined}
        />
        <Kpi
          label="Suscripciones / mes"
          value={pesos(totals.subscriptionsPerMonthCents)}
          hint={`${data.subscriptions.length} activas`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gasto por categoría</CardTitle>
            <CardDescription>Consumo del hogar, todos los meses.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={categoryConfig}
              className="mx-auto aspect-square max-h-[280px]"
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
                  innerRadius={70}
                  strokeWidth={2}
                >
                  {categoryData.map((c) => (
                    <Cell key={c.category} fill={c.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {categoryData.slice(0, 6).map((c) => (
                <div key={c.category} className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: c.fill }}
                  />
                  {c.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gasto por mes</CardTitle>
            <CardDescription>Cargos regulares del hogar.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ spend: { label: "Gasto", color: "var(--chart-1)" } }}
              className="max-h-[280px] w-full"
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
                <Bar dataKey="spend" fill="var(--chart-1)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Utilización por tarjeta</CardTitle>
            <CardDescription>Deuda actual vs. límite de crédito.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.utilization.map((u) => {
              const pct =
                u.limitCents && u.limitCents > 0
                  ? Math.round((u.debtCents / u.limitCents) * 100)
                  : null;
              return (
                <div key={u.cardId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <Link
                      href={`/finance/${u.cardId}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: u.color ?? "var(--chart-1)" }}
                      />
                      {u.name}
                    </Link>
                    <span className="text-muted-foreground font-mono">
                      {pesos(u.debtCents)}
                      {u.limitCents ? ` / ${pesos(u.limitCents)}` : ""}
                    </span>
                  </div>
                  {pct !== null && (
                    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                      <div
                        className={`h-full rounded-full ${pct >= 80 ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📉 Fugas de capital</CardTitle>
            <CardDescription>
              Suscripciones recurrentes y costo del crédito.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {data.subscriptions.slice(0, 6).map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    {s.name}
                    {s.cards.length > 1 && (
                      <Badge variant="destructive" className="text-[10px]">
                        {s.cards.length} tarjetas
                      </Badge>
                    )}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {pesos(s.perMonthCents)}/mes
                  </span>
                </div>
              ))}
            </div>
            {data.fees.length > 0 && (
              <div className="border-t pt-3">
                {data.fees.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="text-destructive font-mono">
                      {pesos(f.cents)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
