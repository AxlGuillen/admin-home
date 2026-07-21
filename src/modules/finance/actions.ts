"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireHousehold } from "@/shared/auth/session";
import { fail, ok, type ActionResult } from "@/shared/result";
import { createClient } from "@/shared/supabase/server";

import { toCard } from "./queries";
import { cardInputSchema } from "./schemas";
import type { Card } from "./types";

const FINANCE_PATH = "/finance";

const idSchema = z.uuid("Identificador inválido");

// Server Actions are public HTTP endpoints: each re-checks membership and validates its input.
function parseCardForm(formData: FormData) {
  return cardInputSchema.safeParse(Object.fromEntries(formData.entries()));
}

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

export async function createCard(
  formData: FormData,
): Promise<ActionResult<Card>> {
  const { user, householdId } = await requireHousehold();

  const parsed = parseCardForm(formData);
  if (!parsed.success) {
    return fail("Revisa los datos de la tarjeta", fieldErrors(parsed.error));
  }

  const input = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("home_finance_cards")
    .insert({
      household_id: householdId,
      created_by: user.id,
      type: input.type,
      name: input.name,
      description: input.description,
      issuer: input.issuer,
      last_four: input.lastFour,
      color: input.color,
      cut_day: input.cutDay,
      payment_day: input.paymentDay,
      owner_person_id: input.ownerPersonId,
      credit_limit_cents: input.creditLimitCents,
    })
    .select("*")
    .single();

  if (error) return fail(`No se pudo crear la tarjeta: ${error.message}`);

  revalidatePath(FINANCE_PATH);
  return ok(toCard(data));
}

export async function updateCard(
  formData: FormData,
): Promise<ActionResult<Card>> {
  await requireHousehold();

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("Identificador inválido");

  const parsed = parseCardForm(formData);
  if (!parsed.success) {
    return fail("Revisa los datos de la tarjeta", fieldErrors(parsed.error));
  }

  const input = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("home_finance_cards")
    .update({
      type: input.type,
      name: input.name,
      description: input.description,
      issuer: input.issuer,
      last_four: input.lastFour,
      color: input.color,
      cut_day: input.cutDay,
      payment_day: input.paymentDay,
      owner_person_id: input.ownerPersonId,
      credit_limit_cents: input.creditLimitCents,
    })
    .eq("id", id.data)
    .select("*")
    .maybeSingle();

  if (error) return fail(`No se pudo guardar la tarjeta: ${error.message}`);
  // maybeSingle returns null when RLS filtered the row: it doesn't exist or isn't your household's.
  if (!data) return fail("La tarjeta no existe o no es de tu hogar");

  revalidatePath(FINANCE_PATH);
  return ok(toCard(data));
}

// Archiving is the CRUD "delete": it hides the card without losing payment history.
export async function archiveCard(id: string): Promise<ActionResult<void>> {
  return setArchivedAt(id, new Date().toISOString(), "archivar");
}

export async function restoreCard(id: string): Promise<ActionResult<void>> {
  return setArchivedAt(id, null, "restaurar");
}

async function setArchivedAt(
  id: string,
  archivedAt: string | null,
  verb: string,
): Promise<ActionResult<void>> {
  await requireHousehold();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return fail("Identificador inválido");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("home_finance_cards")
    .update({ archived_at: archivedAt })
    .eq("id", parsedId.data)
    .select("id")
    .maybeSingle();

  if (error) return fail(`No se pudo ${verb} la tarjeta: ${error.message}`);
  if (!data) return fail("La tarjeta no existe o no es de tu hogar");

  revalidatePath(FINANCE_PATH);
  return ok();
}

// Hard delete. Safe only while nothing references a card; block it once payments exist.
export async function deleteCard(id: string): Promise<ActionResult<void>> {
  await requireHousehold();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return fail("Identificador inválido");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("home_finance_cards")
    .delete()
    .eq("id", parsedId.data)
    .select("id")
    .maybeSingle();

  if (error) return fail(`No se pudo eliminar la tarjeta: ${error.message}`);
  if (!data) return fail("La tarjeta no existe o no es de tu hogar");

  revalidatePath(FINANCE_PATH);
  return ok();
}
