"use client";

import { useActionState, useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/shared/result";

import { createPerson, updatePerson } from "../actions";
import type { Person } from "../types";
import { ColorPicker } from "./color-picker";

type State = ActionResult<Person> | null;

export function PersonFormDialog({
  person,
  trigger,
}: {
  person?: Person;
  trigger: React.ReactNode;
}) {
  const isEdit = person !== undefined;
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState<string | null>(person?.color ?? null);
  const formId = useId();

  const [state, formAction, pending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const result = isEdit
        ? await updatePerson(formData)
        : await createPerson(formData);

      if (result.ok) {
        setOpen(false);
        toast.success(isEdit ? "Persona actualizada" : "Persona agregada");
      }
      return result;
    },
    null,
  );

  const nameError = state && !state.ok ? state.fieldErrors?.name?.[0] : undefined;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setColor(person?.color ?? null);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar persona" : "Agregar persona"}
          </DialogTitle>
          <DialogDescription>
            Sirve para saber de quién es cada cosa y filtrar. No cambia quién ve
            qué: en el hogar todos ven todo.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} action={formAction} className="grid gap-4">
          {isEdit && <input type="hidden" name="id" value={person.id} />}

          <div className="grid gap-2">
            <Label htmlFor={`${formId}-name`}>Nombre</Label>
            <Input
              id={`${formId}-name`}
              name="name"
              defaultValue={person?.name}
              placeholder="Ej. Axl"
              maxLength={60}
              required
            />
            {nameError && (
              <p role="alert" className="text-destructive text-xs">
                {nameError}
              </p>
            )}
          </div>

          <ColorPicker name="color" value={color} onChange={setColor} />

          {state && !state.ok && !state.fieldErrors && (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={pending}>
            {pending ? "Guardando…" : isEdit ? "Guardar" : "Agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
