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

export type Membership = { user: User; householdId: string };

/** Hogar del usuario, o `null` si no pertenece a ninguno. */
export async function getHouseholdId(user: User): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("home_household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return data?.household_id ?? null;
}

/**
 * Exige sesión **y** membresía de un hogar.
 *
 * Tener sesión no basta: `auth.users` es compartido con las otras apps de este
 * proyecto de Supabase, así que un usuario de esas apps pasa el login sin más.
 * La membresía es lo que da acceso real a Admin Home.
 */
export async function requireHousehold(): Promise<Membership> {
  const user = await requireUser();
  const householdId = await getHouseholdId(user);
  if (!householdId) redirect("/no-access");
  return { user, householdId };
}
