"use client";

import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/shared/config/env";

import type { Database } from "./database.types";

/** Cliente de Supabase para Client Components. Sujeto a RLS. */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
