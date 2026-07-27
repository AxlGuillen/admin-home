import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

import { getLedger, type Ledger } from "./ledger";
import { clientForToken, type McpClient } from "./supabase";

export type McpIdentity = {
  userId: string;
  email: string | null;
  clientId: string;
  /** Ordered set of the caller's households. The cache key; see ledger.ts. */
  householdKey: string;
};

export type McpContext = McpIdentity & {
  client: McpClient;
  /** Lazy: get_household_overview and get_card_detail never touch the ~2,000-row ledger. */
  ledger: () => Promise<Ledger>;
};

export class UnauthenticatedError extends Error {}

export function contextFrom(authInfo: AuthInfo | undefined): McpContext {
  if (!authInfo) {
    throw new UnauthenticatedError("Sin sesión. Vuelve a conectar el conector.");
  }

  const identity = authInfo.extra as McpIdentity | undefined;
  if (!identity?.householdKey) {
    throw new UnauthenticatedError("Sesión incompleta. Vuelve a conectar el conector.");
  }

  const client = clientForToken(authInfo.token);
  let pending: Promise<Ledger> | null = null;

  return {
    ...identity,
    client,
    ledger: () => (pending ??= getLedger(client, identity.householdKey)),
  };
}
