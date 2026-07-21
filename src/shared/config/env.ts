import { z } from "zod";

/**
 * Variables de entorno validadas al arrancar. Si falta una, el proceso falla
 * aquí con un mensaje claro en vez de morir con `undefined` a mitad de un request.
 *
 * Las `NEXT_PUBLIC_*` se referencian explícitamente porque Next las inlinea en
 * build time solo si aparecen escritas literalmente.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export const env = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
