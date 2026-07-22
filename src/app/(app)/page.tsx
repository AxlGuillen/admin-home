import Link from "next/link";

import { Kpi, PageHeading } from "@/components/blueprint";
import { formatMoney } from "@/modules/finance";
import { getFinanceOverview, listCards } from "@/modules/finance/server";
import { listPeople } from "@/modules/people/server";
import { MODULES } from "@/shared/config/modules";

export default async function DashboardPage() {
  const [overview, cards, people] = await Promise.all([
    getFinanceOverview(),
    listCards({}),
    listPeople(),
  ]);

  const modules = MODULES.filter((m) => m.id !== "dashboard");
  const activeCards = cards.filter((c) => c.archivedAt === null).length;

  return (
    <div className="ah-view">
      <PageHeading
        kicker="PANEL DE LA CASA"
        title="Inicio"
        subtitle="Un vistazo general y los módulos disponibles para administrar la casa."
      />

      <div className="mb-9 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Balance débito"
          value={
            overview.totals.debitBalanceCents !== null
              ? formatMoney(overview.totals.debitBalanceCents)
              : "—"
          }
          tone="pos"
        />
        <Kpi
          label="Deuda de crédito"
          value={formatMoney(overview.totals.currentDebtCents)}
          tone="danger"
        />
        <Kpi label="Tarjetas activas" value={String(activeCards)} />
        <Kpi label="Personas" value={String(people.length)} />
      </div>

      <p className="text-muted-foreground mb-3.5 font-[family-name:var(--font-barlow-condensed)] text-[11px] tracking-[0.16em]">
        MÓDULOS
      </p>
      <div className="grid gap-[18px] sm:grid-cols-2">
        {modules.map((mod) => (
          <Link
            key={mod.id}
            href={mod.href}
            className="blueprint bg-card elev-md relative p-6 transition-[transform,box-shadow] hover:-translate-y-[3px] hover:shadow-[var(--shadow-lg)]"
          >
            <i className="corner tl" />
            <i className="corner tr" />
            <i className="corner bl" />
            <i className="corner br" />
            <div className="border-primary text-primary mb-4 grid size-11 place-items-center border">
              <mod.icon className="size-[22px]" strokeWidth={1.5} />
            </div>
            <h3 className="mb-1.5 text-[22px]">{mod.label}</h3>
            <p className="text-muted-foreground text-[13px]">
              {mod.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
