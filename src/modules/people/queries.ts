import "server-only";

import { requireHousehold } from "@/shared/auth/session";
import type { Tables } from "@/shared/supabase/database.types";
import { createClient } from "@/shared/supabase/server";

import type { Person } from "./types";

type PersonRow = Tables<"home_people">;

export function toPerson(row: PersonRow): Person {
  return {
    id: row.id,
    householdId: row.household_id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Personas del hogar, alfabéticas. RLS ya limita al hogar del usuario. */
export async function listPeople(): Promise<Person[]> {
  await requireHousehold();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("home_people")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar las personas: ${error.message}`);
  return data.map(toPerson);
}
