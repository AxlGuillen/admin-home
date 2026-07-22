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
import { Button } from "@/components/ui/button";

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
    <div className="blueprint bg-card elev-sm relative flex items-center gap-3.5 px-5 py-4">
      <span
        aria-hidden
        className="border-divider grid size-9 flex-none place-items-center border font-[family-name:var(--font-barlow-condensed)] text-[15px]"
        style={{ color: person.color ?? "var(--foreground)" }}
      >
        {person.name.charAt(0).toUpperCase()}
      </span>

      <div className="flex-1">
        <PersonBadge person={person} />
      </div>

      {person.userId && (
        <span className="tag-neutral text-muted-foreground bg-[color-mix(in_srgb,var(--ink)_8%,transparent)] px-2.5 py-1 text-[11px]">
          Tiene cuenta
        </span>
      )}

      <PersonFormDialog
        person={person}
        trigger={
          <Button
            variant="secondary"
            size="icon"
            disabled={pending}
            aria-label={`Editar ${person.name}`}
            className="size-9 rounded-none"
          >
            <Pencil />
          </Button>
        }
      />

      <Button
        variant="secondary"
        size="icon"
        disabled={pending}
        onClick={() => setConfirmDelete(true)}
        aria-label={`Eliminar ${person.name}`}
        className="size-9 rounded-none"
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
    </div>
  );
}
