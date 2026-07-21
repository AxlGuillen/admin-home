import Link from "next/link";
import { PlusIcon } from "@animateicons/react/lucide";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  // `includeArchived` trae activas + archivadas; en la vista de archivadas solo
  // queremos las archivadas.
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
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Finanzas</h1>
          <p className="text-muted-foreground text-sm">
            {showArchived
              ? "Tarjetas archivadas."
              : "Tarjetas de débito y crédito del hogar."}
          </p>
        </div>

        <Button variant="ghost" size="sm" asChild>
          <Link href={showArchived ? filterHref(owner) : `/finance?archived=1`}>
            {showArchived ? "Ver activas" : "Ver archivadas"}
          </Link>
        </Button>

        <CardFormDialog
          people={people}
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              Nueva tarjeta
            </Button>
          }
        />
      </div>

      {people.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Dueño:</span>
          <Button
            variant={owner ? "ghost" : "secondary"}
            size="sm"
            asChild
          >
            <Link href={filterHref()}>Todos</Link>
          </Button>
          {people.map((person) => (
            <Button
              key={person.id}
              variant={owner === person.id ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link href={filterHref(person.id)}>{person.name}</Link>
            </Button>
          ))}
          <Button
            variant={owner === NO_OWNER ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link href={filterHref(NO_OWNER)}>Sin dueño</Link>
          </Button>
        </div>
      )}

      {visible.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {showArchived
                ? "No hay tarjetas archivadas"
                : owner
                  ? "Ninguna tarjeta con ese dueño"
                  : "Aún no hay tarjetas"}
            </CardTitle>
            <CardDescription>
              {showArchived
                ? "Las tarjetas que archives aparecerán aquí."
                : owner
                  ? "Prueba con otro dueño o quita el filtro."
                  : "Registra tu primera tarjeta para empezar a llevar el control."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3">
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
