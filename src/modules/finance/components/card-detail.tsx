"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";

import { formatMoney } from "../money";
import type { CardDetail } from "../analytics";
import {
  CATEGORY_COLORS,
  categoryLabel,
  monthLabel,
} from "../categories";

const pesos = (cents: number) => formatMoney(cents);

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
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
    </Card>
  );
}

export function CardDetailDashboard({ data }: { data: CardDetail }) {
  const { card, totals } = data;
  const monthKeys = data.months.map((m) => m.month);
  const [selected, setSelected] = useState(
    monthKeys[monthKeys.length - 1] ?? "",
  );

  const utilizationPct =
    card.isCredit && totals.limitCents && totals.limitCents > 0
      ? Math.round((totals.balanceCents ?? 0) / totals.limitCents * 100)
      : null;

  const monthData = data.months.map((m) => ({
    label: monthLabel(m.month),
    spend: m.spendCents,
    inflow: m.inflowCents,
  }));

  const categoryData = data.byCategory.map((c, i) => ({
    ...c,
    label: categoryLabel(c.category),
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const monthMovements = data.movements.filter((m) => m.month === selected);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {card.isCredit ? (
          <>
            <Kpi label="Deuda actual" value={pesos(totals.balanceCents ?? 0)} />
            <Kpi
              label="Utilización"
              value={utilizationPct !== null ? `${utilizationPct}%` : "—"}
              tone={utilizationPct !== null && utilizationPct >= 80 ? "danger" : undefined}
            />
            <Kpi
              label="Costo del crédito"
              value={pesos(totals.costCents)}
              tone="danger"
            />
            <Kpi label="Gasto total" value={pesos(totals.spendCents)} />
          </>
        ) : (
          <>
            <Kpi label="Saldo actual" value={pesos(totals.balanceCents ?? 0)} />
            <Kpi label="Ingresos" value={pesos(totals.inflowCents)} />
            <Kpi label="Gastos / salidas" value={pesos(totals.spendCents)} />
            <Kpi label="Meses" value={String(data.months.length)} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {card.isCredit ? "Cargos vs. pagos" : "Ingresos vs. gastos"} por mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                spend: {
                  label: card.isCredit ? "Cargos" : "Gastos",
                  color: "var(--chart-1)",
                },
                inflow: {
                  label: card.isCredit ? "Pagos" : "Ingresos",
                  color: "var(--chart-2)",
                },
              }}
              className="max-h-[280px] w-full"
            >
              <BarChart data={monthData} accessibilityLayer>
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div className="flex w-full justify-between gap-3">
                          <span>{name === "spend" ? (card.isCredit ? "Cargos" : "Gastos") : card.isCredit ? "Pagos" : "Ingresos"}</span>
                          <span className="font-mono">{pesos(Number(value))}</span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar dataKey="spend" fill="var(--chart-1)" radius={4} />
                <Bar dataKey="inflow" fill="var(--chart-2)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gasto por categoría</CardTitle>
            <CardDescription>De esta tarjeta.</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-muted-foreground py-10 text-center text-sm">
                Sin gasto categorizado.
              </p>
            ) : (
              <ChartContainer
                config={Object.fromEntries(
                  categoryData.map((c) => [
                    c.category,
                    { label: c.label, color: c.fill },
                  ]),
                ) as ChartConfig}
                className="mx-auto aspect-square max-h-[240px]"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name) => (
                          <div className="flex w-full justify-between gap-3">
                            <span>{categoryLabel(String(name))}</span>
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
                    innerRadius={60}
                    strokeWidth={2}
                  >
                    {categoryData.map((c) => (
                      <Cell key={c.category} fill={c.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {data.subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📉 Suscripciones en esta tarjeta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.subscriptions.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  {s.name}
                  <span className="text-muted-foreground ml-2 text-xs">
                    {s.months} meses
                  </span>
                </span>
                <span className="text-muted-foreground font-mono">
                  {pesos(s.perMonthCents)}/mes
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Movimientos</CardTitle>
          <div className="flex flex-wrap gap-1 pt-2">
            {monthKeys.map((m) => (
              <Button
                key={m}
                size="sm"
                variant={m === selected ? "secondary" : "ghost"}
                onClick={() => setSelected(m)}
              >
                {monthLabel(m)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-border divide-y text-sm">
            {monthMovements.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center">
                Sin movimientos este mes.
              </p>
            ) : (
              monthMovements.map((m, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <span className="text-muted-foreground w-14 shrink-0 text-xs">
                    {m.date?.slice(5) ?? ""}
                  </span>
                  <span className="flex-1 truncate">{m.description}</span>
                  {m.category && (
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {categoryLabel(m.category)}
                    </Badge>
                  )}
                  <span
                    className={`w-24 shrink-0 text-right font-mono ${m.flow === "in" ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                  >
                    {m.flow === "in" ? "+" : "−"}
                    {pesos(m.amountCents).replace(/^-/, "")}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
