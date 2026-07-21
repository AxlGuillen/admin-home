import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/shared/supabase/server";

/** Devuelve el usuario autenticado, o `null` si no hay sesión válida. */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Exige sesión. Si no hay, redirige a /login.
 *
 * Úsalo al inicio de toda Server Action y de todo layout protegido. `getUser()`
 * valida el JWT contra Supabase; `getSession()` no, así que no lo uses en servidor.
 */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
