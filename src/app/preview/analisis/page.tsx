import { BarChart3, CreditCard, LayoutDashboard, Users } from "lucide-react";

import { PageHeading } from "@/components/blueprint";
import { FinanceOverviewDashboard } from "@/modules/finance";
import type { FinanceOverview } from "@/modules/finance/server";

// Ruta de preview SOLO para validar la identidad visual con el design-critic.
// No usa auth ni datos reales; se elimina al terminar el rediseño.
const sample: FinanceOverview = {
  totals: {
    spendCents: 45732000,
    creditCostCents: 1604800,
    interestCents: 986500,
    feesCents: 458300,
    currentDebtCents: 13920400,
    limitCents: 87000000,
    debitBalanceCents: 1856300,
    subscriptionsPerMonthCents: 424000,
  },
  byMonth: [
    { month: "2026-02", spend: 6480000, cost: 210000 },
    { month: "2026-03", spend: 7210000, cost: 118000 },
    { month: "2026-04", spend: 6890000, cost: 96000 },
    { month: "2026-05", spend: 8940000, cost: 341000 },
    { month: "2026-06", spend: 7630000, cost: 402000 },
    { month: "2026-07", spend: 8582000, cost: 437800 },
  ],
  byCategory: [
    { category: "groceries", amount: 12840000 },
    { category: "restaurant", amount: 8610000 },
    { category: "health", amount: 6120000 },
    { category: "services", amount: 5240000 },
    { category: "shopping", amount: 4930000 },
    { category: "transport", amount: 3990000 },
  ],
  utilization: [
    {
      cardId: "a",
      name: "BBVA Azul",
      ownerInitial: "C",
      ownerColor: "var(--p-2)",
      color: "var(--d-credito)",
      debtCents: 1763555,
      limitCents: 1830000,
    },
    {
      cardId: "b",
      name: "Nu Oro",
      ownerInitial: "C",
      ownerColor: "var(--p-2)",
      color: "var(--d-credito)",
      debtCents: 2360702,
      limitCents: 2500000,
    },
    {
      cardId: "c",
      name: "CMV Oro",
      ownerInitial: "A",
      ownerColor: "var(--p-1)",
      color: "var(--d-credito)",
      debtCents: 234900,
      limitCents: 2400000,
    },
    {
      cardId: "d",
      name: "Plata Clásica",
      ownerInitial: "M",
      ownerColor: "var(--p-3)",
      color: "var(--d-credito)",
      debtCents: 516425,
      limitCents: 400000,
    },
  ],
  subscriptions: [
    {
      name: "CLAUDE.AI",
      months: 6,
      perMonthCents: 348000,
      totalCents: 2088000,
      cards: ["Plata"],
    },
    {
      name: "APPLE",
      months: 6,
      perMonthCents: 29900,
      totalCents: 179400,
      cards: ["BBVA Débito"],
    },
    {
      name: "SUSCRIPCIÓN PLATA+",
      months: 6,
      perMonthCents: 4640,
      totalCents: 27840,
      cards: ["Plata"],
    },
    {
      name: "VIDASEGURA",
      months: 6,
      perMonthCents: 65957,
      totalCents: 395742,
      cards: ["BBVA Débito"],
    },
  ],
  fees: [
    { label: "Intereses", cents: 986500, count: 0 },
    { label: "Comisiones", cents: 458300, count: 8 },
    { label: "IVA", cents: 160000, count: 0 },
  ],
};

const NAV = [
  { label: "Inicio", icon: LayoutDashboard, active: false },
  { label: "Finanzas", icon: CreditCard, active: true },
  { label: "Personas", icon: Users, active: false },
];

export default function PreviewAnalisis() {
  return (
    <div className="flex h-svh overflow-hidden">
      <aside className="bg-sidebar border-line flex w-[260px] flex-none flex-col border-r">
        <div className="border-line flex items-center gap-2.5 border-b px-5 py-5">
          <span className="bg-brand grid size-6 place-items-center rounded-[6px]">
            <span className="block size-2 rounded-full bg-white" />
          </span>
          <span className="text-[17px] font-extrabold tracking-[-0.01em]">
            Admin Home
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          <p className="text-ink-mut px-3 pt-1.5 pb-2 font-mono text-[9px] font-bold tracking-[0.06em] uppercase">
            Módulos
          </p>
          {NAV.map((n) => (
            <span
              key={n.label}
              className={
                n.active
                  ? "bg-brand text-white flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-[13px] font-bold"
                  : "text-ink-2 flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-[13px] font-semibold"
              }
            >
              <n.icon className="size-[17px]" strokeWidth={2} />
              {n.label}
            </span>
          ))}
        </nav>
        <div className="m-dark mx-3 mb-3 flex items-center gap-2.5 p-3">
          <span className="grid size-7 flex-none place-items-center rounded-[6px] bg-white/10 font-mono text-[12px] font-bold text-white">
            A
          </span>
          <div className="min-w-0">
            <p className="text-dark-fg nm text-[12px] font-semibold">
              axl13.dev@gmail.com
            </p>
            <span className="text-dark-fg/55 font-mono text-[9px] tracking-[0.04em] uppercase">
              Sesión activa
            </span>
          </div>
        </div>
      </aside>

      <main className="h-svh min-w-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-[1080px] px-8 pt-8 pb-16">
          <PageHeading
            kicker="Finanzas"
            title="Análisis"
            subtitle="Consumo del hogar y fugas de capital, todos los meses."
            actions={
              <span className="border-line text-ink-2 inline-flex items-center gap-2 rounded-[9px] border px-3 py-2 text-[12px] font-semibold">
                <BarChart3 className="size-[15px]" strokeWidth={2} />
                Últimos 6 meses
              </span>
            }
          />
          <FinanceOverviewDashboard data={sample} />
        </div>
      </main>
    </div>
  );
}
