"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Trash2Icon } from "@animateicons/react/lucide";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { deletePerson } from "../actions";
import type { Person } from "../types";
import { PersonBadge } from "./person-badge";
import { PersonFormDialog } from "./person-form-dialog";

export function PersonItem({ person }: { person: Person }) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePerson(person.id);
      if (result.ok) toast.success("Persona eliminada");
      else toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className="flex-1">
          <PersonBadge person={person} />
        </div>

        {person.userId && <Badge variant="secondary">Tiene cuenta</Badge>}

        <PersonFormDialog
          person={person}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              disabled={pending}
              aria-label={`Editar ${person.name}`}
            >
              <Pencil />
            </Button>
          }
        />

        <Button
          variant="ghost"
          size="icon"
          disabled={pending}
          onClick={() => setConfirmDelete(true)}
          aria-label={`Eliminar ${person.name}`}
        >
          <Trash2Icon className="size-4" />
        </Button>

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar a {person.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Sus tarjetas no se borran: quedan sin dueño y las puedes reasignar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
