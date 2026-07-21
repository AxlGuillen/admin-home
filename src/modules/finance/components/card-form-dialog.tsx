"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ColorPicker, type Person } from "@/modules/people";
import type { ActionResult } from "@/shared/result";

import { createCard, updateCard } from "../actions";
import { CARD_TYPE_LABELS, type CardType } from "../schemas";
import type { Card } from "../types";

const NO_OWNER = "none";

type State = ActionResult<Card> | null;

function errorFor(state: State, field: string): string | undefined {
  if (!state || state.ok) return undefined;
  return state.fieldErrors?.[field]?.[0];
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-destructive text-xs">
      {message}
    </p>
  );
}

export function CardFormDialog({
  card,
  people,
  trigger,
}: {
  card?: Card;
  people: Person[];
  trigger: React.ReactNode;
}) {
  const isEdit = card !== undefined;
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<CardType>(card?.type ?? "credito");
  const [color, setColor] = useState<string | null>(card?.color ?? null);
  const [owner, setOwner] = useState<string>(card?.ownerPersonId ?? NO_OWNER);
  const formId = useId();

  // Close and toast inside the action, not a useEffect: reacting to the result with an effect adds a render and ESLint flags it.
  const [state, formAction, pending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const result = isEdit
        ? await updateCard(formData)
        : await createCard(formData);

      if (result.ok) {
        setOpen(false);
        toast.success(isEdit ? "Tarjeta actualizada" : "Tarjeta creada");
      }
      return result;
    },
    null,
  );

  // On reopen, reset to the card's values so a half-finished edit doesn't reappear.
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setType(card?.type ?? "credito");
      setColor(card?.color ?? null);
      setOwner(card?.ownerPersonId ?? NO_OWNER);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar tarjeta" : "Nueva tarjeta"}</DialogTitle>
          <DialogDescription>
            No guardamos el número completo, CVV ni la fecha de caducidad.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} action={formAction} className="grid gap-4">
          {isEdit && <input type="hidden" name="id" value={card.id} />}
          {/* Radix Select submits no native value; these hidden inputs carry it. */}
          <input type="hidden" name="type" value={type} />
          <input
            type="hidden"
            name="ownerPersonId"
            value={owner === NO_OWNER ? "" : owner}
          />

          <div className="grid gap-2">
            <Label htmlFor={`${formId}-type`}>Tipo</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as CardType)}
            >
              <SelectTrigger id={`${formId}-type`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CARD_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${formId}-owner`}>Dueño</Label>
            <Select value={owner} onValueChange={setOwner}>
              <SelectTrigger id={`${formId}-owner`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_OWNER}>Sin asignar</SelectItem>
                {people.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              {people.length === 0 ? (
                <>
                  Todavía no hay personas registradas.{" "}
                  <Link href="/people" className="underline underline-offset-2">
                    Agrégalas en Personas
                  </Link>{" "}
                  para poder asignar dueños.
                </>
              ) : (
                <>
                  Solo para saber de quién es y poder filtrar. En el hogar todos
                  ven todas las tarjetas.
                </>
              )}
            </p>
            <FieldError message={errorFor(state, "ownerPersonId")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${formId}-name`}>Nombre</Label>
            <Input
              id={`${formId}-name`}
              name="name"
              defaultValue={card?.name}
              placeholder="Ej. Nu crédito"
              maxLength={60}
              required
            />
            <FieldError message={errorFor(state, "name")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${formId}-description`}>Descripción</Label>
            <Textarea
              id={`${formId}-description`}
              name="description"
              defaultValue={card?.description ?? ""}
              placeholder="Para qué la usas, notas, etc."
              maxLength={500}
              rows={2}
            />
            <FieldError message={errorFor(state, "description")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-issuer`}>Banco</Label>
              <Input
                id={`${formId}-issuer`}
                name="issuer"
                defaultValue={card?.issuer ?? ""}
                placeholder="Ej. BBVA"
                maxLength={60}
              />
              <FieldError message={errorFor(state, "issuer")} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${formId}-lastFour`}>Últimos 4 dígitos</Label>
              <Input
                id={`${formId}-lastFour`}
                name="lastFour"
                defaultValue={card?.lastFour ?? ""}
                placeholder="1234"
                inputMode="numeric"
                maxLength={4}
              />
              <FieldError message={errorFor(state, "lastFour")} />
            </div>
          </div>

          {type === "credito" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`${formId}-cutDay`}>Día de corte</Label>
                <Input
                  id={`${formId}-cutDay`}
                  name="cutDay"
                  type="number"
                  min={1}
                  max={31}
                  defaultValue={card?.cutDay ?? ""}
                  placeholder="5"
                />
                <FieldError message={errorFor(state, "cutDay")} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`${formId}-paymentDay`}>Día de pago</Label>
                <Input
                  id={`${formId}-paymentDay`}
                  name="paymentDay"
                  type="number"
                  min={1}
                  max={31}
                  defaultValue={card?.paymentDay ?? ""}
                  placeholder="25"
                />
                <FieldError message={errorFor(state, "paymentDay")} />
              </div>

              <p className="text-muted-foreground col-span-full text-xs">
                Si el día de pago es menor o igual al de corte, se entiende que cae
                en el mes siguiente. En meses cortos, el 31 se ajusta al último día.
              </p>

              <div className="col-span-full grid gap-2">
                <Label htmlFor={`${formId}-creditLimit`}>
                  Límite de crédito{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <Input
                  id={`${formId}-creditLimit`}
                  name="creditLimitCents"
                  inputMode="decimal"
                  defaultValue={
                    card?.creditLimitCents != null
                      ? (card.creditLimitCents / 100).toFixed(2)
                      : ""
                  }
                  placeholder="50000.00"
                />
                <FieldError message={errorFor(state, "creditLimitCents")} />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <ColorPicker name="color" value={color} onChange={setColor} />
            <FieldError message={errorFor(state, "color")} />
          </div>

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
            {pending ? "Guardando…" : isEdit ? "Guardar" : "Crear tarjeta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
