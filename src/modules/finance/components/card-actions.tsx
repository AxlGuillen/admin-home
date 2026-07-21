"use client";

import { useState, useTransition } from "react";
// @animateicons covers only part of Lucide: Archive, Pencil, RotateCcw aren't in it, so they come from lucide-react.
import { Archive, Pencil, RotateCcw } from "lucide-react";
import { EllipsisVerticalIcon, Trash2Icon } from "@animateicons/react/lucide";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Person } from "@/modules/people";

import { archiveCard, deleteCard, restoreCard } from "../actions";
import type { Card } from "../types";
import { CardFormDialog } from "./card-form-dialog";

export function CardActions({
  card,
  people,
}: {
  card: Card;
  people: Person[];
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isArchived = card.archivedAt !== null;

  function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    successMessage: string,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(successMessage);
      else toast.error(result.error ?? "Algo salió mal");
    });
  }

  return (
    <div className="flex items-center">
      {/* Edit lives outside the menu on purpose: a Dialog nested in a DropdownMenu unmounts when the menu closes. */}
      <CardFormDialog
        card={card}
        people={people}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            disabled={pending}
            aria-label={`Editar ${card.name}`}
          >
            <Pencil />
          </Button>
        }
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={pending}
            aria-label={`Más acciones de ${card.name}`}
          >
            <EllipsisVerticalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isArchived ? (
            <DropdownMenuItem
              onSelect={() =>
                run(() => restoreCard(card.id), "Tarjeta restaurada")
              }
            >
              <RotateCcw />
              Restaurar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() =>
                run(() => archiveCard(card.id), "Tarjeta archivada")
              }
            >
              <Archive />
              Archivar
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmDelete(true)}
          >
            <Trash2Icon className="size-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {card.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto la borra para siempre. Si solo quieres sacarla de la lista,
              archívala: así conserva el historial cuando registremos pagos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                run(() => deleteCard(card.id), "Tarjeta eliminada")
              }
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
