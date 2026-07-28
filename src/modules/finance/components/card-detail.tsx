"use client";

import { useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import {
  Chip,
  Dark,
  Delta,
  Dominant,
  Gauge,
  Kpi,
  Panel,
} from "@/components/blueprint";
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

// Hero y KPI sin centavos; la fila de detalle sí los lleva (política del SKIN).
const short = (cents: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(cents / 100);

export function CardDetailDashboard({ data }: { data: CardDetail }) {
  const { card, totals } = data;
  const monthKeys = data.months.map((m) => m.month);
  const [selected, setSelected] = useState(
    monthKeys[monthKeys.length - 1] ?? "",
  );
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

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

  const monthMovements = data.movements
    .filter((m) => m.month === selected)
    .sort((a, b) =>
      sortBy === "amount"
        ? b.amountCents - a.amountCents
        : (b.date ?? "").localeCompare(a.date ?? ""),
    );

  // Top 5 cargos del mes: solo salidas, que es donde se busca la fuga.
  const topCharges = monthMovements
    .filter((m) => m.flow === "out")
    .sort((a, b) => b.amountCents - a.amountCents)
    .slice(0, 5);
  const topMax = topCharges[0]?.amountCents ?? 0;
  const monthOut = monthMovements
    .filter((m) => m.flow === "out")
    .reduce((n, m) => n + m.amountCents, 0);
  const outCount = monthMovements.filter((m) => m.flow === "out").length;
  const avgTicket = outCount > 0 ? Math.round(monthOut / outCount) : 0;

  // Gasto del mes seleccionado contra el inmediato anterior del histórico.
  const selectedIdx = data.months.findIndex((m) => m.month === selected);
  const prevMonth = selectedIdx > 0 ? data.months[selectedIdx - 1] : undefined;
  const thisMonth = data.months[selectedIdx];
  const spendDelta =
    prevMonth && thisMonth && prevMonth.spendCents > 0
      ? ((thisMonth.spendCents - prevMonth.spendCents) / prevMonth.spendCents) *
        100
      : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Dominant
          label={card.isCredit ? "Deuda de la tarjeta" : "Saldo de la cuenta"}
          value={short(totals.balanceCents ?? 0)}
          hint={`${data.months.length} estados de cuenta cargados`}
          chip={
            card.isCredit && utilizationPct !== null ? (
              <Chip tone="onBrand">{utilizationPct}% del límite</Chip>
            ) : undefined
          }
          footer={
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">
                  {card.isCredit ? "Cargos del periodo" : "Salidas"}
                </span>
                <span className="tnum font-semibold text-white">
                  {short(totals.spendCents)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">
                  {card.isCredit ? "Pagos aplicados" : "Ingresos"}
                </span>
                <span className="tnum font-semibold text-white">
                  {short(totals.inflowCents)}
                </span>
              </div>
            </div>
          }
        />

        <div className="grid grid-cols-2 gap-4">
          {card.isCredit ? (
            <>
              <Gauge
                pct={utilizationPct ?? 0}
                label="Utilización"
                hint="Deuda vs. límite"
              />
              <Kpi
                label="Gasto total"
                value={short(totals.spendCents)}
                step={3}
                ticks
                delta={
                  spendDelta !== null && prevMonth ? (
                    <Delta
                      value={`${Math.abs(spendDelta).toFixed(0)}%`}
                      direction={spendDelta >= 0 ? "up" : "down"}
                      tone={spendDelta >= 0 ? "danger" : "ok"}
                    />
                  ) : undefined
                }
                hint={prevMonth ? `vs ${monthLabel(prevMonth.month)}` : undefined}
              />
              <Kpi
                label="Pagos aplicados"
                value={short(totals.inflowCents)}
                step={1}
              />
              <Dark
                label="Costo del crédito"
                keyValue={short(totals.costCents)}
              >
                <p className="text-dark-fg/70 text-[11px]">
                  Intereses, comisiones e IVA.
                </p>
              </Dark>
            </>
          ) : (
            <>
              <Kpi
                label="Ingresos"
                value={short(totals.inflowCents)}
                step={3}
                ticks
              />
              <Kpi
                label="Salidas"
                value={short(totals.spendCents)}
                step={2}
              />
              <Kpi label="Meses" value={String(data.months.length)} step={1} />
              <Kpi
                label="Movimientos"
                value={String(data.movements.length)}
              />
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Panel
          title={`${card.isCredit ? "Cargos vs. pagos" : "Ingresos vs. gastos"} por mes`}
        >
          <ChartContainer
            config={{
              spend: {
                label: card.isCredit ? "Cargos" : "Gastos",
                color: "var(--d-credito)",
              },
              inflow: {
                label: card.isCredit ? "Pagos" : "Ingresos",
                color: "var(--brand)",
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
              <Bar dataKey="spend" fill="var(--d-credito)" />
              <Bar dataKey="inflow" fill="var(--brand)" />
            </BarChart>
          </ChartContainer>
        </Panel>

        <Panel title="Gasto por categoría" subtitle="De esta tarjeta.">
          {categoryData.length === 0 ? (
            <p className="text-ink-mut py-10 text-center text-xs">
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
                className="flex items-center justify-between text-xs font-semibold"
              >
                <span>
                  {s.name}
                  <span className="text-ink-mut ml-2 text-[11px] font-normal">
                    {s.months} meses
                  </span>
                </span>
                <span className="tnum text-ink-mut">
                  {pesos(s.perMonthCents)}/mes
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Fugas detectadas: goteo recurrente y posible cobro doble */}
      {(data.recurring.length > 0 || data.duplicates.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.recurring.length > 0 && (
            <Panel
              title="Comercios recurrentes"
              subtitle="Aparecen en 3 o más meses: el goteo que no se ve de un solo cargo."
            >
              <div className="space-y-2">
                {data.recurring.slice(0, 6).map((r) => (
                  <div
                    key={r.name}
                    className="flex items-center gap-2 text-xs font-semibold"
                  >
                    <span className="nm flex-1">{r.name}</span>
                    <Chip tone="neutral" numeric>
                      {r.count}×
                    </Chip>
                    <span className="text-ink-mut tnum w-[86px] flex-none text-right font-normal">
                      {pesos(r.perMonthCents)}/mes
                    </span>
                    <span className="tnum w-[100px] flex-none text-right">
                      {pesos(r.totalCents)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-line mt-3 flex items-center justify-between border-t pt-3 text-xs">
                <span className="text-ink-mut font-semibold">
                  {data.recurring.length} comercios recurrentes
                </span>
                <span className="tnum text-ink">
                  {pesos(
                    data.recurring.reduce((n, r) => n + r.totalCents, 0),
                  )}
                </span>
              </div>
            </Panel>
          )}

          {data.duplicates.length > 0 ? (
            <Dark
              label="Posible cobro doble"
              keyValue={String(data.duplicates.length)}
            >
              <p className="text-dark-fg/70 mb-3 text-[11px]">
                Mismo comercio y mismo monto dentro de 3 días. Revisa que no sea
                un cargo repetido.
              </p>
              <div className="space-y-2">
                {data.duplicates.slice(0, 4).map((d, i) => (
                  <div
                    key={`${d.description}-${i}`}
                    className="flex items-center gap-2 text-xs font-semibold"
                  >
                    <span className="nm text-dark-fg/90 flex-1">
                      {d.description}
                    </span>
                    <span className="text-dark-fg/70 tnum flex-none text-[10px] font-normal">
                      {d.dates.map((x) => x.slice(5)).join(" · ")}
                    </span>
                    <span className="tnum text-danger-on-dark flex-none">
                      {pesos(d.amountCents)}
                    </span>
                  </div>
                ))}
              </div>
            </Dark>
          ) : (
            <Panel
              title="Sin cargos duplicados"
              subtitle="No hay dos cargos idénticos del mismo comercio en 3 días."
            >
              <div className="hatch-empty h-16 rounded-[var(--r-el)]" />
            </Panel>
          )}
        </div>
      )}

      {/* Top 5 cargos del mes + tabla de movimientos */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Panel
          title={`Top 5 cargos · ${monthLabel(selected)}`}
          subtitle={
            monthOut > 0
              ? `${Math.round((topCharges.reduce((n, m) => n + m.amountCents, 0) / monthOut) * 100)}% de la salida del mes`
              : undefined
          }
        >
          {topCharges.length === 0 ? (
            <p className="text-ink-mut py-6 text-center text-xs">
              Sin cargos este mes.
            </p>
          ) : (
            <ol className="space-y-2.5">
              {topCharges.map((m, i) => (
                <li key={`${m.description}-${i}`} className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="text-ink-mut tnum w-3 flex-none text-[10px]">
                      {i + 1}
                    </span>
                    <span className="nm flex-1">{m.description}</span>
                    <span className="tnum flex-none">
                      {pesos(m.amountCents)}
                    </span>
                  </div>
                  <div className="ml-5 h-1.5 overflow-hidden rounded-full bg-[var(--line-2)]">
                    <div
                      className="bg-d-credito h-full rounded-full"
                      style={{
                        width: `${topMax > 0 ? (m.amountCents / topMax) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
            <h4 className="text-[13px] font-extrabold">Movimientos</h4>
            <div className="flex items-center gap-2">
              <span className="text-ink-mut font-mono text-[9px] font-bold tracking-[0.04em] uppercase">
                Orden
              </span>
              <div className="flex" role="group" aria-label="Ordenar por">
                {(
                  [
                    { key: "date", label: "Fecha" },
                    { key: "amount", label: "Monto" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setSortBy(o.key)}
                    aria-pressed={sortBy === o.key}
                    className={cn(
                      "border-line -ml-px border px-2.5 py-1 text-[10px] font-bold first:rounded-l-[var(--r-el-sm)] last:rounded-r-[var(--r-el-sm)]",
                      sortBy === o.key
                        ? "relative z-10 border-[var(--fill-strong)] bg-[var(--fill-strong)] text-[var(--fill-strong-fg)]"
                        : "text-ink-2 hover:bg-line-2",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-2 flex flex-wrap">
            {monthKeys.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelected(m)}
                className={cn(
                  "border-line -ml-px border px-3 py-1.5 text-[11px] font-bold first:rounded-l-[var(--r-el-sm)] last:rounded-r-[var(--r-el-sm)]",
                  m === selected
                    ? "bg-brand border-brand relative z-10 text-white"
                    : "text-ink-2 hover:bg-line-2",
                )}
              >
                {monthLabel(m)}
              </button>
            ))}
          </div>

          <div>
            {monthMovements.length === 0 ? (
              <p className="text-ink-mut py-6 text-center text-xs">
                Sin movimientos este mes.
              </p>
            ) : (
              monthMovements.map((m, i) => (
                <div
                  key={i}
                  className="border-line/60 flex items-center gap-3.5 border-b py-2 text-xs font-semibold last:border-0"
                >
                  <span className="text-ink-mut tnum w-11 shrink-0 text-[11px] font-normal">
                    {m.date?.slice(5) ?? ""}
                  </span>
                  <span className="nm flex-1">{m.description}</span>
                  {m.category && (
                    <span className="text-ink-mut border-line shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold">
                      {categoryLabel(m.category)}
                    </span>
                  )}
                  <span
                    className={cn(
                      "tnum w-[110px] shrink-0 text-right",
                      m.flow === "in" && "text-ok",
                    )}
                  >
                    {m.flow === "in" ? "+" : "−"}
                    {pesos(m.amountCents).replace(/^-/, "")}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="border-line mt-3 flex items-center justify-between border-t pt-3 text-xs">
            <span className="text-ink-mut font-semibold">
              {monthMovements.length} movimientos · ticket promedio{" "}
              <span className="tnum text-ink">{pesos(avgTicket)}</span>
            </span>
            <span className="tnum text-ink">Salida {pesos(monthOut)}</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}
