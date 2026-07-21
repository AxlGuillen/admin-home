import "server-only";

import { requireHousehold } from "@/shared/auth/session";
import type { Tables } from "@/shared/supabase/database.types";
import { createClient } from "@/shared/supabase/server";

import type { Card } from "./types";

type CardRow = Tables<"home_finance_cards">;

/** DB is snake_case, the domain camelCase; the translation lives only here. */
export function toCard(row: CardRow): Card {
  return {
    id: row.id,
    householdId: row.household_id,
    type: row.type,
    name: row.name,
    description: row.description,
    issuer: row.issuer,
    lastFour: row.last_four,
    color: row.color,
    cutDay: row.cut_day,
    paymentDay: row.payment_day,
    ownerPersonId: row.owner_person_id,
    creditLimitCents: row.credit_limit_cents,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// No household_id filter: RLS already does it, and duplicating it would mask a broken policy.
export async function listCards({
  includeArchived = false,
  ownerPersonId,
}: {
  includeArchived?: boolean;
  /** Presentation filter. `"none"` = cards with no owner assigned. */
  ownerPersonId?: string | "none";
} = {}): Promise<Card[]> {
  await requireHousehold();
  const supabase = await createClient();

  let query = supabase.from("home_finance_cards").select("*");
  if (!includeArchived) query = query.is("archived_at", null);
  if (ownerPersonId === "none") query = query.is("owner_person_id", null);
  else if (ownerPersonId) query = query.eq("owner_person_id", ownerPersonId);

  const { data, error } = await query
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar las tarjetas: ${error.message}`);
  return data.map(toCard);
}

export async function getCard(id: string): Promise<Card | null> {
  await requireHousehold();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("home_finance_cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar la tarjeta: ${error.message}`);
  return data ? toCard(data) : null;
}
