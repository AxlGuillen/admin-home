import { PlusIcon } from "@animateicons/react/lucide";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PersonFormDialog, PersonItem } from "@/modules/people";
import { listPeople } from "@/modules/people/server";

export const metadata = { title: "Personas · Admin Home" };

export default async function PeoplePage() {
  const people = await listPeople();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Personas</h1>
          <p className="text-muted-foreground text-sm">
            Quién vive en la casa. Sirve para etiquetar y filtrar, no para
            restringir: todos ven todo.
          </p>
        </div>

        <PersonFormDialog
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              Agregar persona
            </Button>
          }
        />
      </div>

      {people.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aún no hay personas</CardTitle>
            <CardDescription>
              Agrega a quienes viven en la casa para poder asignarles tarjetas.
              No necesitan cuenta en la app.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3">
          {people.map((person) => (
            <PersonItem key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
