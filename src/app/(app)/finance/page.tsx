import Link from "next/link";
import { BarChart3, Plus } from "lucide-react";

import { PageHeading } from "@/components/blueprint";
import { Button } from "@/components/ui/button";
import { CardFormDialog, CardItem } from "@/modules/finance";
import { listCards } from "@/modules/finance/server";
import { listPeople } from "@/modules/people/server";

export const metadata = { title: "Finanzas · Admin Home" };

const NO_OWNER = "none";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string; owner?: string }>;
}) {
  const { archived, owner } = await searchParams;
  const showArchived = archived === "1";

  const [cards, people] = await Promise.all([
    listCards({ includeArchived: showArchived, ownerPersonId: owner }),
    listPeople(),
  ]);

  // includeArchived returns active + archived; the archived view wants only archived.
  const visible = showArchived
    ? cards.filter((c) => c.archivedAt !== null)
    : cards;

  const peopleById = new Map(people.map((p) => [p.id, p]));

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
