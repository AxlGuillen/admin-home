import "server-only";

import { requireHousehold } from "@/shared/auth/session";
import { createClient } from "@/shared/supabase/server";

import { computeCardDetail, computeFinanceOverview } from "./analytics-compute";
import { fetchCardDetailRows, fetchOverviewRows } from "./analytics-fetch";
import type { CardDetail, FinanceOverview } from "./analytics-types";

// Wrapper de Next: pone la sesión del request y delega. El cómputo vive en
// `analytics-compute` para que el servidor MCP lo reuse sin arrastrar `cookies()`.

export async function getCardDetail(cardId: string): Promise<CardDetail | null> {
  await requireHousehold();
  const supabase = await createClient();

  const rows = await fetchCardDetailRows(supabase, cardId);
  return rows ? computeCardDetail(rows) : null;
}

export async function getFinanceOverview(): Promise<FinanceOverview> {
  await requireHousehold();
  const supabase = await createClient();

  return computeFinanceOverview(await fetchOverviewRows(supabase));
}

export {
  computeCardDetail,
  computeDuplicates,
  computeFinanceOverview,
  computeRecurring,
  merchantKey,
} from "./analytics-compute";
export type * from "./analytics-types";
