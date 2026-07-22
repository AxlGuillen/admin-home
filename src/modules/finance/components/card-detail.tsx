"use client";

import { useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { Kpi, Panel } from "@/components/blueprint";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

import type { CardDetail } from "../analytics";
import { CATEGORY_COLORS, categoryLabel, monthLabel } from "../categories";
import { formatMoney } from "../money";

const pesos = (cents: number) => formatMoney(cents);

export function CardDetailDashboard({ data }: { data: CardDetail }) {
  const { card, totals } = data;
  const monthKeys = data.months.map((m) => m.month);
  const [selected, setSelected] = useState(
    monthKeys[monthKeys.length - 1] ?? "",
  );

  const utilizationPct =
    card.isCredit && totals.limitCents && totals.limitCents > 0
      ? Math.round(((totals.balanceCents ?? 0) / totals.limitCents) * 100)
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
    <div className="space-y-4.5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {card.isCredit ? (
          <>
            <Kpi label="Deuda actual" value={pesos(totals.balanceCents ?? 0)} />
            <Kpi
              label="Utilización"
              value={utilizationPct !== null ? `${utilizationPct}%` : "—"}
              tone={
                utilizationPct !== null && utilizationPct >= 80
                  ? "danger"
                  : "pos"
              }
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
            <Kpi label="Ingresos" value={pesos(totals.inflowCents)} tone="pos" />
            <Kpi label="Gastos / salidas" value={pesos(totals.spendCents)} />
            <Kpi label="Meses" value={String(data.months.length)} />
          </>
        )}
      </div>

      <div className="grid gap-4.5 lg:grid-cols-[1.2fr_1fr]">
        <Panel
          title={`${card.isCredit ? "Cargos vs. pagos" : "Ingresos vs. gastos"} por mes`}
        >
          <ChartContainer
            config={{
              spend: {
                label: card.isCredit ? "Cargos" : "Gastos",
                color: "var(--cat-4)",
              },
              inflow: {
                label: card.isCredit ? "Pagos" : "Ingresos",
                color: "var(--cat-2)",
              },
            }}
            className="max-h-[260px] w-full"
          >
            <BarChart data={monthData} accessibilityLayer>
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis hide />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex w-full justify-between gap-3">
                        <span>
                          {name === "spend"
                            ? card.isCredit
                              ? "Cargos"
                              : "Gastos"
                            : card.isCredit
                              ? "Pagos"
                              : "Ingresos"}
                        </span>
                        <span className="font-mono">{pesos(Number(value))}</span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="spend" fill="var(--cat-4)" />
              <Bar dataKey="inflow" fill="var(--cat-2)" />
            </BarChart>
          </ChartContainer>
        </Panel>

        <Panel title="Gasto por categoría" subtitle="De esta tarjeta.">
          {categoryData.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              Sin gasto categorizado.
            </p>
          ) : (
            <ChartContainer
              config={
                Object.fromEntries(
                  categoryData.map((c) => [
                    c.category,
                    { label: c.label, color: c.fill },
                  ]),
                ) as ChartConfig
              }
              className="mx-auto aspect-square max-h-[230px]"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name) => (
                        <div className="flex w-full justify-between gap-3">
                          <span>{categoryLabel(String(name))}</span>
                          <span className="font-mono">
                            {pesos(Number(value))}
                          </span>
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
        </Panel>
      </div>

      {data.subscriptions.length > 0 && (
        <Panel title="Suscripciones en esta tarjeta">
          <div className="space-y-2.5">
            {data.subscriptions.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between text-[13px]"
              >
                <span>
                  {s.name}
                  <span className="text-muted-foreground ml-2 text-xs">
                    {s.months} meses
                  </span>
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {pesos(s.perMonthCents)}/mes
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel>
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
          <h4 className="text-base">Movimientos</h4>
          <div className="flex flex-wrap">
            {monthKeys.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelected(m)}
                className={cn(
                  "border-divider -ml-px border px-3 py-1.5 font-[family-name:var(--font-barlow-condensed)] text-[13px]",
                  m === selected
                    ? "bg-primary text-primary-foreground border-primary relative z-10"
                    : "hover:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)]",
                )}
              >
                {monthLabel(m)}
              </button>
            ))}
          </div>
        </div>
        <div>
          {monthMovements.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Sin movimientos este mes.
            </p>
          ) : (
            monthMovements.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-3.5 border-b border-[color-mix(in_srgb,var(--ink)_8%,transparent)] py-2.5 text-[13px]"
              >
                <span className="text-muted-foreground w-11 shrink-0 text-xs">
                  {m.date?.slice(5) ?? ""}
                </span>
                <span className="flex-1 truncate">{m.description}</span>
                {m.category && (
                  <span className="text-muted-foreground shrink-0 border border-[color-mix(in_srgb,var(--ink)_18%,transparent)] px-2 py-0.5 text-[10px]">
                    {categoryLabel(m.category)}
                  </span>
                )}
                <span
                  className={cn(
                    "w-[110px] shrink-0 text-right tabular-nums",
                    m.flow === "in" && "text-[var(--c-pos)]",
                  )}
                >
                  {m.flow === "in" ? "+" : "−"}
                  {pesos(m.amountCents).replace(/^-/, "")}
                </span>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
