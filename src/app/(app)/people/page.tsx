import { PlusIcon } from "@animateicons/react/lucide";

import { PageHeading } from "@/components/blueprint";
import { Button } from "@/components/ui/button";
import { PersonFormDialog, PersonItem } from "@/modules/people";
import { listPeople } from "@/modules/people/server";

export const metadata = { title: "Personas · Admin Home" };

export default async function PeoplePage() {
  const people = await listPeople();

  return (
    <div className="ah-view">
      <PageHeading
        kicker="MÓDULO"
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

      {people.length === 0 ? (
        <div className="blueprint bg-card relative p-6">
          <h3 className="mb-1 text-lg">Aún no hay personas</h3>
          <p className="text-muted-foreground text-sm">
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
