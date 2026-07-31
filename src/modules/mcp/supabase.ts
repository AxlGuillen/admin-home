import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/shared/config/env";
import type { Database } from "@/shared/supabase/database.types";

export type McpClient = SupabaseClient<Database>;

const AUTH_OFF = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
} as const;

/**
 * One client per request, acting as the token's user so RLS applies exactly as it
 * does in the app. No query filters by household_id — RLS is the only isolation.
 *
 * `accessToken` rather than a global Authorization header: supabase-js replaces
 * `client.auth` with a throwing proxy when it is set, so this client cannot be used
 * to sign anything in or out by accident.
 */
export function clientForToken(accessToken: string): McpClient {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: AUTH_OFF, accessToken: async () => accessToken },
  );
}

/** Separate client because `clientForToken` has no usable `.auth`. Stateless, so shared. */
let verifier: McpClient | null = null;

export function verifierClient(): McpClient {
  verifier ??= createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: AUTH_OFF },
  );
  return verifier;
}
