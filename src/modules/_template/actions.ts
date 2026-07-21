"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/shared/auth/session";
import { fail, ok, type ActionResult } from "@/shared/result";
import { createClient } from "@/shared/supabase/server";

import { createExampleSchema } from "./schemas";

/**
 * Toda Server Action sigue la misma receta:
 *   1. requireUser()          — nunca confíes en que el layout ya validó.
 *   2. safeParse del input    — el cliente puede mandar lo que sea.
 *   3. escribir vía Supabase  — RLS es la última línea de defensa.
 *   4. revalidatePath()       — para que la UI se refresque.
 */
export async function createExample(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireUser();

  const parsed = createExampleSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    return fail("Revisa los datos del formulario", z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createClient();
  void supabase; // Reemplaza por el insert real.

  revalidatePath("/");
  return ok({ id: crypto.randomUUID() });
}
