"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { fail, type ActionResult } from "@/shared/result";
import { createClient } from "@/shared/supabase/server";

const credentialsSchema = z.object({
  email: z.email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  // `next` viene del navegador. `//evil.com` y `/\evil.com` empiezan con "/" pero
  // son redirects fuera del sitio, y este campo ahora carga el flujo de OAuth.
  next: z
    .string()
    .refine(
      (v) => v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\"),
      "Ruta interna inválida",
    )
    .optional(),
});

export async function signIn(formData: FormData): Promise<ActionResult<never>> {
  const parsed = credentialsSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    return fail(
      "Revisa tus datos",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  // Generic on purpose: distinguishing "no user" from "wrong password" lets attackers enumerate accounts.
  if (error) return fail("Correo o contraseña incorrectos");

  revalidatePath("/", "layout");
  redirect(parsed.data.next ?? "/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
