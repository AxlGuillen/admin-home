import { PlusIcon } from "@animateicons/react/lucide";

import { Chip, Dominant, Kpi, PageHeading } from "@/components/blueprint";
import { Button } from "@/components/ui/button";
import { listCards } from "@/modules/finance/server";
import { PersonFormDialog, PersonItem } from "@/modules/people";
import { listPeople } from "@/modules/people/server";

export const metadata = { title: "Personas · Admin Home" };

export default async function PeoplePage() {
  const [people, cards] = await Promise.all([listPeople(), listCards({})]);

  const active = cards.filter((c) => c.archivedAt === null);
  const assigned = active.filter((c) => c.ownerPersonId !== null).length;
  const withAccount = people.filter((p) => p.userId !== null).length;

  return (
    <div className="ah-view">
      <PageHeading
        kicker="Módulo"
        title="Personas"
        subtitle="Quién vive en la casa. Sirve para etiquetar y filtrar, no para restringir: todos ven todo."
        actions={
          <PersonFormDialog
            trigger={
              <Button>
                <PlusIcon className="size-4" />
                Agregar persona
              </Button>
            }
          />
        }
      />

      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Dominant
          label="Personas del hogar"
          value={String(people.length)}
          hint="Todas ven y editan todo; el color solo etiqueta."
          chip={
            <Chip tone="onBrand">
              {withAccount} con cuenta
            </Chip>
          }
          footer={
            <div className="flex flex-wrap gap-2">
              {people.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white"
                >
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{ background: p.color ?? "#fff" }}
                  />
                  {p.name.split(" ")[0]}
                </span>
              ))}
            </div>
          }
        />

        <div className="grid grid-cols-2 gap-4">
          <Kpi
            label="Tarjetas asignadas"
            value={String(assigned)}
            step={3}
            hint={`de ${active.length} activas`}
          />
          <Kpi
            label="Sin dueño"
            value={String(active.length - assigned)}
            step={1}
            hint="pendientes de asignar"
          />
        </div>
      </div>

      {people.length === 0 ? (
        <div className="m-base p-[18px]">
          <h3 className="text-[13px] font-extrabold">Aún no hay personas</h3>
          <p className="text-ink-mut mt-1.5 text-[11px]">
            Agrega a quienes viven en la casa para poder asignarles tarjetas. No
            necesitan cuenta en la app.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {people.map((person) => (
            <PersonItem key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
