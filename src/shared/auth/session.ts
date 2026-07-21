import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/shared/supabase/server";

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Use getUser (validates the JWT against Supabase), not getSession, on the server.
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export type Membership = { user: User; householdId: string };

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

// A session isn't enough: auth.users is shared across the project's apps, so household membership is what grants real access.
export async function requireHousehold(): Promise<Membership> {
  const user = await requireUser();
  const householdId = await getHouseholdId(user);
  if (!householdId) redirect("/no-access");
  return { user, householdId };
}
