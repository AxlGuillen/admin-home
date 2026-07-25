import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/shared/supabase/database.types";

import { env } from "./env";
import { readSession, SESSION_FILE, writeSession } from "./session";

export type Client = SupabaseClient<Database>;

export type Session = { client: Client; householdId: string; email: string };

/** Sin sesión: la publishable key sola no ve nada, RLS lo impide. */
export function publicClient(): Client {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

export class AuthRequiredError extends Error {}

const LOGIN_HINT = 'Corre "npm run mcp:login" en el repo para volver a entrar.';

// No se usa service_role a propósito: brincaría RLS y este proyecto de Supabase
// es compartido con otras apps. Con el refresh token del usuario, el MCP ve
// exactamente lo que ve la app.
export async function openSession(): Promise<Session> {
  const stored = readSession();
  if (!stored) {
    throw new AuthRequiredError(
      `No hay sesión guardada en ${SESSION_FILE}. ${LOGIN_HINT}`,
    );
  }

  const client = publicClient();
  const { data, error } = await client.auth.refreshSession({
    refresh_token: stored.refreshToken,
  });

  if (error || !data.session) {
    throw new AuthRequiredError(
      `La sesión guardada ya no sirve: ${error?.message ?? "sin sesión"}. ${LOGIN_HINT}`,
    );
  }

  // Supabase rota el refresh token en cada uso; si no se guarda el nuevo, el
  // siguiente arranque falla con un error que no dice por qué.
  writeSession({
    email: stored.email,
    refreshToken: data.session.refresh_token,
    savedAt: new Date().toISOString(),
  });

  // Tener sesión no es tener acceso: auth.users es compartido con las otras apps.
  const { data: membership, error: membershipError } = await client
    .from("home_household_members")
    .select("household_id")
    .eq("user_id", data.session.user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw new AuthRequiredError(
      `No se pudo verificar el hogar: ${membershipError.message}`,
    );
  }
  if (!membership) {
    throw new AuthRequiredError(
      `La cuenta ${stored.email} no pertenece a ningún hogar, así que no ve datos.`,
    );
  }

  return { client, householdId: membership.household_id, email: stored.email };
}
