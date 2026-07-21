"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireHousehold } from "@/shared/auth/session";
import { fail, ok, type ActionResult } from "@/shared/result";
import { createClient } from "@/shared/supabase/server";

import { toPerson } from "./queries";
import { personInputSchema } from "./schemas";
import type { Person } from "./types";

const idSchema = z.uuid("Identificador inválido");

// Postgres 23505: unique index violation on (household_id, lower(name)).
const DUPLICATE_NAME = "23505";

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

// People render across several modules, so revalidate the whole tree.
function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function createPerson(
  formData: FormData,
): Promise<ActionResult<Person>> {
  const { householdId } = await requireHousehold();

  const parsed = personInputSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    return fail("Revisa los datos", fieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("home_people")
    .insert({
      household_id: householdId,
      name: parsed.data.name,
      color: parsed.data.color,
    })
    .select("*")
    .single();

  if (error?.code === DUPLICATE_NAME) {
    return fail("Ya existe una persona con ese nombre", {
      name: ["Ya existe una persona con ese nombre"],
    });
  }
  if (error) return fail(`No se pudo crear la persona: ${error.message}`);

  revalidateAll();
  return ok(toPerson(data));
}

export async function updatePerson(
  formData: FormData,
): Promise<ActionResult<Person>> {
  await requireHousehold();

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("Identificador inválido");

  const parsed = personInputSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    return fail("Revisa los datos", fieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("home_people")
    .update({ name: parsed.data.name, color: parsed.data.color })
    .eq("id", id.data)
    .select("*")
    .maybeSingle();

  if (error?.code === DUPLICATE_NAME) {
    return fail("Ya existe una persona con ese nombre", {
      name: ["Ya existe una persona con ese nombre"],
    });
  }
  if (error) return fail(`No se pudo guardar: ${error.message}`);
  if (!data) return fail("La persona no existe o no es de tu hogar");

  revalidateAll();
  return ok(toPerson(data));
}

// FKs to home_people are `on delete set null`, so a person's cards survive deletion unowned.
export async function deletePerson(id: string): Promise<ActionResult<void>> {
  await requireHousehold();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return fail("Identificador inválido");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("home_people")
    .delete()
    .eq("id", parsedId.data)
    .select("id")
    .maybeSingle();

  if (error) return fail(`No se pudo eliminar: ${error.message}`);
  if (!data) return fail("La persona no existe o no es de tu hogar");

  revalidateAll();
  return ok();
}
