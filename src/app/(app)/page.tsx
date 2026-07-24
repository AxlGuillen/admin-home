import { CreditCard, Users } from "lucide-react";
import Link from "next/link";

import { Chip, Dark, Dominant, Kpi, PageHeading } from "@/components/blueprint";
import { getFinanceOverview, listCards } from "@/modules/finance/server";
import { listPeople } from "@/modules/people/server";
import { MODULES } from "@/shared/config/modules";

const short = (cents: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(cents / 100);

export default async function DashboardPage() {
  const [overview, cards, people] = await Promise.all([
    getFinanceOverview(),
    listCards({}),
    listPeople(),
  ]);

  const modules = MODULES.filter((m) => m.id !== "dashboard");
  const activeCards = cards.filter((c) => c.archivedAt === null).length;

  // Posición neta del hogar: lo que hay en débito menos lo que se debe en crédito.
  const balanceCents =
    (overview.totals.debitBalanceCents ?? 0) - overview.totals.currentDebtCents;
  const negative = balanceCents < 0;

  return (
    <div className="ah-view">
      <PageHeading
        kicker="Panel de la casa"
        title="Inicio"
        subtitle="Un vistazo general y los módulos para administrar la casa."
      />

      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Dominant
          label="Balance del hogar"
          value={short(balanceCents)}
          hint={negative ? "La deuda supera al efectivo" : "Efectivo menos deuda"}
          chip={
            <Chip tone="onBrand">{negative ? "En rojo" : "En positivo"}</Chip>
          }
          footer={
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">En débito</span>
                <span className="tnum font-semibold text-white">
                  {overview.totals.debitBalanceCents !== null
                    ? short(overview.totals.debitBalanceCents)
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">Deuda de crédito</span>
                <span className="tnum font-semibold text-white">
                  {short(overview.totals.currentDebtCents)}
                </span>
              </div>
            </div>
          }
        />

        <div className="grid grid-cols-2 gap-4">
          <Kpi
            label="Tarjetas activas"
            value={String(activeCards)}
            icon={CreditCard}
            family="credito"
            step={3}
            hint={`${cards.length} registradas`}
          />
          <Kpi
            label="Personas"
            value={String(people.length)}
            icon={Users}
            family="debito"
            step={2}
            hint="en el hogar"
          />
          <Kpi
            label="Gasto acumulado"
            value={short(overview.totals.spendCents)}
            step={1}
            hint={`${overview.byMonth.length} meses`}
            ticks
          />
          <Dark
            label="Fuga del mes"
            keyValue={short(overview.totals.creditCostCents)}
          >
            <p className="text-dark-fg/70 text-[11px]">
              Intereses, comisiones e IVA acumulados.
            </p>
          </Dark>
        </div>
      </div>

      <p className="text-ink-mut mb-3 font-mono text-[9px] font-bold tracking-[0.06em] uppercase">
        Módulos
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((mod) => (
          <Link
            key={mod.id}
            href={mod.href}
            className="m-base group flex items-start gap-3.5 p-[18px] transition-[transform,box-shadow] duration-[var(--dur)] hover:-translate-y-px hover:shadow-[var(--sh-raise)]"
          >
            <span className="bg-brand-050 text-brand grid size-9 flex-none place-items-center rounded-[var(--r-el-sm)]">
              <mod.icon className="size-[18px]" strokeWidth={2} />
            </span>
            <div>
              <h3 className="text-[13px] leading-none font-extrabold">
                {mod.label}
              </h3>
              <p className="text-ink-mut mt-1.5 text-[11px] text-pretty">
                {mod.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
