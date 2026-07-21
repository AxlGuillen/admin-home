import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/shared/config/env";

import type { Database } from "./database.types";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 *
 * Crea uno nuevo por request — nunca lo guardes en una variable de módulo, o
 * acabarías compartiendo la sesión de un usuario entre requests.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Los Server Components no pueden escribir cookies. El refresco de
            // sesión lo hace `proxy.ts`, así que ignorar esto es seguro.
          }
        },
      },
    },
  );
}
