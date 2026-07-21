import "server-only";

import { requireUser } from "@/shared/auth/session";
import { createClient } from "@/shared/supabase/server";

import type { Example } from "./types";

/**
 * Lecturas del módulo. Siempre server-only y siempre tras `requireUser()`.
 *
 * No filtres por `user_id` aquí "para estar seguro": la política de RLS ya lo hace.
 * Duplicar el filtro esconde políticas mal escritas hasta que es tarde.
 */
export async function listExamples(): Promise<Example[]> {
  await requireUser();
  const supabase = await createClient();

  // Reemplaza por la tabla real del módulo.
  void supabase;
  return [];
}
