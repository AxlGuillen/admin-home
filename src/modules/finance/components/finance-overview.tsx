"use client";

import Link from "next/link";
import { Bar, BarChart, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts";

import {
  Chip,
  Dark,
  Dominant,
  Gauge,
  Kpi,
  Panel,
  PersonDot,
} from "@/components/blueprint";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { HOUSEHOLD_TIME_ZONE } from "@/shared/config/household";

import type { FinanceOverview } from "../analytics";
import { CATEGORY_COLORS, CATEGORY_LABELS, monthLabel } from "../categories";
import { formatMoney } from "../money";

const pesos = (cents: number) => formatMoney(cents);

// KPIs sin centavos: el drama de escala pide cifras cortas; el detalle fino vive en tablas.
const pesosShort = (cents: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(cents / 100);

const compact = (cents: number) => {
  const v = cents / 100;
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`;
};

// Mes en curso (YYYY-MM) en la zona del hogar, no la del proceso.
const currentMonth = new Intl.DateTimeFormat("en-CA", {
  timeZone: HOUSEHOLD_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
}).format(new Date());

type BarLabelProps = {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  index?: number;
  value?: unknown;
};

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
  const categoryTotal = categoryData.reduce((n, c) => n + c.amount, 0);

  const categoryConfig: ChartConfig = Object.fromEntries(
    categoryData.map((c) => [c.category, { label: c.label, color: c.fill }]),
  );

  const maxSpend = Math.max(0, ...data.byMonth.map((m) => m.spend));
  const maxIndex = data.byMonth.findIndex((m) => m.spend === maxSpend);
  const monthData = data.byMonth.map((m) => ({
    ...m,
    label: monthLabel(m.month),
  }));

  // Delta del último mes cerrado vs. el anterior, para el chip de la dominante.
  const closed = data.byMonth.filter((m) => m.month !== currentMonth);
  const prev = closed.at(-2);
  const last = closed.at(-1);
  const delta =
    prev && last && prev.spend > 0
      ? ((last.spend - prev.spend) / prev.spend) * 100
      : null;

  function MaxBarLabel({ x, y, width, index, value }: BarLabelProps) {
    if (index !== maxIndex || x == null || y == null || width == null)
      return null;
    const text = compact(Number(value));
    const w = text.length * 6.4 + 14;
    const cx = Number(x) + Number(width) / 2;
    return (
      <g>
        <rect
          x={cx - w / 2}
          y={Number(y) - 24}
          width={w}
          height={17}
          rx={8.5}
          fill="var(--ink)"
        />
        <text
          x={cx}
          y={Number(y) - 12}
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="700"
          fill="#fff"
          style={{
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {text}
        </text>
      </g>
    );
  }

  return (
    <div className="space-y-4">
      {/* Fila hero: dominante (gasto total) + KPIs con gauge */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Dominant
          label="Gasto total del periodo"
          value={pesos(totals.spendCents)}
          hint={`${data.byMonth.length} meses de estados de cuenta`}
          chip={
            delta !== null && prev ? (
              <Chip tone="onBrand">
                {delta >= 0 ? "↗" : "↘"} {Math.abs(delta).toFixed(1)}% vs{" "}
                {monthLabel(prev.month)}
              </Chip>
            ) : undefined
          }
          footer={
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70">Deuda de crédito</span>
              <span className="tnum font-semibold text-white">
                {pesos(totals.currentDebtCents)}
              </span>
            </div>
          }
        />
        <div className="grid grid-cols-2 gap-4">
          <Kpi
            label="Deuda actual"
            value={pesosShort(totals.currentDebtCents)}
            hint={`de ${pesosShort(totals.limitCents)} de límite`}
            ticks
          />
          <Gauge
            pct={utilizationPct ?? 0}
            label="Utilización"
            hint="Deuda vs. límite del hogar"
          />
          <Kpi
            label="Suscripciones / mes"
            value={pesosShort(totals.subscriptionsPerMonthCents)}
            chip={<Chip tone="neutral">{data.subscriptions.length} activas</Chip>}
          />
          <Kpi
            label="Balance débito"
            value={
              totals.debitBalanceCents !== null
                ? pesosShort(totals.debitBalanceCents)
                : "—"
            }
          />
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Gasto por categoría"
          subtitle="Consumo del hogar, todos los meses."
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <ChartContainer
                config={categoryConfig}
                className="aspect-square h-[190px]"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name) => (
                          <div className="flex w-full justify-between gap-3">
                            <span>{CATEGORY_LABELS[String(name)] ?? name}</span>
                            <span className="tnum">{pesos(Number(value))}</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={58}
                    outerRadius={90}
                    cornerRadius={6}
                    paddingAngle={2.5}
                    strokeWidth={0}
                  >
                    {categoryData.map((c) => (
                      <Cell key={c.category} fill={c.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="tnum text-[15px] leading-none font-extrabold">
                    {compact(categoryTotal)}
                  </div>
                  <div className="text-ink-mut mt-1 font-mono text-[8px] font-bold tracking-[0.04em] uppercase">
                    {categoryData.length} categorías
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              {categoryData.slice(0, 6).map((c) => (
                <div key={c.category} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2 flex-none rounded-full"
                    style={{ background: c.fill }}
                  />
                  <span className="nm flex-1">{c.label}</span>
                  <span className="tnum text-ink-mut">{pesos(c.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Gasto por mes" subtitle="Cargos regulares del hogar.">
          <ChartContainer
            config={{ spend: { label: "Gasto", color: "var(--brand)" } }}
            className="h-[190px] w-full"
          >
            <BarChart
              data={monthData}
              accessibilityLayer
              margin={{ top: 26 }}
              barSize={26}
            >
              <defs>
                {/* Mes en curso: rayado 45° 3px/3px (dato incompleto, DESIGN §5). */}
                <pattern
                  id="fo-progress"
                  width="6"
                  height="6"
                  patternTransform="rotate(45)"
                  patternUnits="userSpaceOnUse"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="6"
                    stroke="var(--ink-3)"
                    strokeWidth="3"
                  />
                </pattern>
              </defs>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
              />
              <YAxis hide />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="tnum">{pesos(Number(value))}</span>
                    )}
                  />
                }
              />
              <Bar dataKey="spend" radius={[13, 13, 13, 13]}>
                <LabelList content={MaxBarLabel} dataKey="spend" />
                {monthData.map((m) => (
                  <Cell
                    key={m.month}
                    fill={
                      m.month === currentMonth
                        ? "url(#fo-progress)"
                        : m.spend === maxSpend
                          ? "var(--brand)"
                          : "var(--ink-3)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </Panel>
      </div>

      {/* Utilización + fugas (oscura) */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Utilización por tarjeta"
          subtitle="Deuda actual vs. límite de crédito."
        >
          <div className="space-y-2.5">
            {data.utilization.map((u) => {
              const pct =
                u.limitCents && u.limitCents > 0
                  ? Math.round((u.debtCents / u.limitCents) * 100)
                  : null;
              // 80% es el umbral unico del sistema (SKIN): arriba de eso ya es fuga.
              const over = pct !== null && pct >= 80;
              return (
                <div key={u.cardId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <Link
                      href={`/finance/${u.cardId}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <span
                        className="size-2 flex-none rounded-full"
                        style={{ background: u.color ?? "var(--brand)" }}
                      />
                      <span className="nm">{u.name}</span>
                      {u.ownerInitial && u.ownerColor && (
                        <PersonDot
                          initial={u.ownerInitial}
                          color={u.ownerColor}
                        />
                      )}
                    </Link>
                    <span className="text-ink-mut flex items-center gap-2">
                      {pct !== null &&
                        (over ? (
                          <Chip tone="danger">{pct}%</Chip>
                        ) : (
                          <span className="tnum">{pct}%</span>
                        ))}
                      <span className="tnum">
                        {pesos(u.debtCents)}
                        {u.limitCents ? ` / ${pesos(u.limitCents)}` : ""}
                      </span>
                    </span>
                  </div>
                  {pct !== null && (
                    <div className="hatch-empty h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className={
                          over
                            ? "bg-danger h-full rounded-full"
                            : "bg-brand h-full rounded-full"
                        }
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="border-line mt-3 flex items-center justify-between border-t pt-3 text-xs">
            <span className="text-ink-mut font-semibold">
              Total · {data.utilization.length} tarjetas
            </span>
            <span className="tnum text-ink">
              {pesos(totals.currentDebtCents)}
              {totals.limitCents > 0 && (
                <span className="text-ink-mut">
                  {" / "}
                  {pesos(totals.limitCents)}
                </span>
              )}
            </span>
          </div>
        </Panel>

        <Dark
          label="Fuga de capital"
          keyValue={pesosShort(totals.creditCostCents)}
        >
          <p className="text-dark-fg/75 -mt-1 text-[11px]">
            Costo del crédito acumulado
          </p>
          <div className="mt-3 space-y-1.5 border-t border-white/12 pt-3">
            {data.fees.map((f) => (
              <div
                key={f.label}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-dark-fg/75">{f.label}</span>
                <span className="tnum text-danger font-semibold">
                  {pesos(f.cents)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-white/12 pt-3">
            <p className="text-dark-fg/60 mb-2 font-mono text-[9px] font-bold tracking-[0.04em] uppercase">
              Suscripciones
            </p>
            <div className="space-y-2">
              {data.subscriptions.slice(0, 5).map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="nm text-dark-fg/90">{s.name}</span>
                  <span className="tnum text-dark-fg">
                    {pesos(s.perMonthCents)}/mes
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Dark>
      </div>
    </div>
  );
}
