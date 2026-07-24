import Link from "next/link";
import { BarChart3, Plus } from "lucide-react";

import { Chip, Dark, Dominant, PageHeading } from "@/components/blueprint";
import { Button } from "@/components/ui/button";
import {
  CardFormDialog,
  CardItem,
  daysUntil,
  formatCivilDate,
  isCreditCard,
  nextPaymentDate,
  todayIn,
} from "@/modules/finance";
import { getFinanceOverview, listCards } from "@/modules/finance/server";
import { listPeople } from "@/modules/people/server";
import {
  HOUSEHOLD_LOCALE,
  HOUSEHOLD_TIME_ZONE,
} from "@/shared/config/household";

const short = (cents: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(cents / 100);

export const metadata = { title: "Finanzas · Admin Home" };

const NO_OWNER = "none";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string; owner?: string }>;
}) {
  const { archived, owner } = await searchParams;
  const showArchived = archived === "1";

  const [cards, people, overview] = await Promise.all([
    listCards({ includeArchived: showArchived, ownerPersonId: owner }),
    listPeople(),
    getFinanceOverview(),
  ]);

  // includeArchived returns active + archived; the archived view wants only archived.
  const visible = showArchived
    ? cards.filter((c) => c.archivedAt !== null)
    : cards;

  const peopleById = new Map(people.map((p) => [p.id, p]));

  // Próximo pago del hogar: la tarjeta de crédito activa que vence primero.
  const ref = todayIn(HOUSEHOLD_TIME_ZONE);
  const upcoming = cards
    .filter(isCreditCard)
    .filter((c) => c.archivedAt === null)
    .map((c) => {
      const due = nextPaymentDate(c.cutDay, c.paymentDay, ref);
      return { card: c, due, days: daysUntil(due, ref) };
    })
    .sort((a, b) => a.days - b.days)[0];

  const utilizationPct =
    overview.totals.limitCents > 0
      ? Math.round(
          (overview.totals.currentDebtCents / overview.totals.limitCents) * 100,
        )
      : null;

  function filterHref(nextOwner?: string) {
    const params = new URLSearchParams();
    if (showArchived) params.set("archived", "1");
    if (nextOwner) params.set("owner", nextOwner);
    const query = params.toString();
    return query ? `/finance?${query}` : "/finance";
  }

  return (
    <div className="ah-view">
      <PageHeading
        kicker="MÓDULO"
        title="Finanzas"
        subtitle={
          showArchived
            ? "Tarjetas archivadas."
            : "Tarjetas de débito y crédito del hogar."
        }
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/finance/analisis">
                <BarChart3 className="size-[15px]" strokeWidth={1.5} />
                Análisis
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link
                href={showArchived ? filterHref(owner) : `/finance?archived=1`}
              >
                {showArchived ? "Ver activas" : "Ver archivadas"}
              </Link>
            </Button>
            <CardFormDialog
              people={people}
              trigger={
                <Button>
                  <Plus className="size-[15px]" strokeWidth={1.6} />
                  Nueva tarjeta
                </Button>
              }
            />
          </>
        }
      />

      {!showArchived && (
        <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Dominant
            label="Deuda total en crédito"
            value={short(overview.totals.currentDebtCents)}
            hint={`${overview.utilization.length} tarjetas con estado de cuenta`}
            chip={
              utilizationPct !== null ? (
                <Chip tone="onBrand">{utilizationPct}% del límite</Chip>
              ) : undefined
            }
            footer={
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">Límite del hogar</span>
                <span className="tnum font-semibold text-white">
                  {short(overview.totals.limitCents)}
                </span>
              </div>
            }
          />
          {upcoming ? (
            <Dark
              label="Próximo pago"
              keyValue={formatCivilDate(upcoming.due, HOUSEHOLD_LOCALE)}
              keyTone="brand"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-dark-fg/70">Tarjeta</span>
                  <span className="text-dark-fg font-semibold">
                    {upcoming.card.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-dark-fg/70">Faltan</span>
                  <span className="tnum text-dark-fg font-semibold">
                    {upcoming.days} días
                  </span>
                </div>
              </div>
            </Dark>
          ) : null}
        </div>
      )}

      {people.length > 0 && (
        <div className="mb-5.5 flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground mr-0.5 text-[13px]">
            Dueño:
          </span>
          <Button
            variant={owner ? "secondary" : "default"}
            size="sm"
            className="rounded-none"
            asChild
          >
            <Link href={filterHref()}>Todos</Link>
          </Button>
          {people.map((person) => (
            <Button
              key={person.id}
              variant={owner === person.id ? "default" : "secondary"}
              size="sm"
              className="rounded-none"
              asChild
            >
              <Link href={filterHref(person.id)}>{person.name}</Link>
            </Button>
          ))}
          <Button
            variant={owner === NO_OWNER ? "default" : "secondary"}
            size="sm"
            className="rounded-none"
            asChild
          >
            <Link href={filterHref(NO_OWNER)}>Sin dueño</Link>
          </Button>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="blueprint bg-card relative p-6">
          <h3 className="mb-1 text-lg">
            {showArchived
              ? "No hay tarjetas archivadas"
              : owner
                ? "Ninguna tarjeta con ese dueño"
                : "Aún no hay tarjetas"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {showArchived
              ? "Las tarjetas que archives aparecerán aquí."
              : owner
                ? "Prueba con otro dueño o quita el filtro."
                : "Registra tu primera tarjeta para empezar a llevar el control."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              owner={
                card.ownerPersonId
                  ? (peopleById.get(card.ownerPersonId) ?? null)
                  : null
              }
              people={people}
            />
          ))}
        </div>
      )}
    </div>
  );
}
