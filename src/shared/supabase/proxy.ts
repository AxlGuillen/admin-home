import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/shared/config/env";

import type { Database } from "./database.types";

/**
 * Refresca el token de sesión en cada request y propaga las cookies nuevas.
 * Lo llama `proxy.ts` en la raíz (lo que en Next 15 y antes era `middleware.ts`).
 *
 * Ojo: esto es un chequeo optimista para redirigir rápido. La seguridad real la
 * da RLS en Postgres, no este archivo.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // No metas código entre `createServerClient` y `getUser()`: un return temprano
  // aquí deja la sesión sin refrescar y provoca logouts aleatorios.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
