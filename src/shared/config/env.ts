import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

/**
 * Falla ruidosamente y con instrucciones. Esto revienta en build, no en runtime,
 * porque Next inlinea las `NEXT_PUBLIC_*` al compilar: sin ellas el bundle saldría
 * con `undefined` y la app fallaría en el navegador sin decir por qué.
 *
 * El ZodError crudo salía como "invalid_type at path NEXT_PUBLIC_SUPABASE_URL"
 * dentro de un stack de Turbopack, que no le dice a nadie qué hacer.
 */
export function parseEnv<T extends z.ZodType>(
  schema: T,
  values: Record<string, unknown>,
  where: string,
): z.infer<T> {
  const result = schema.safeParse(values);
  if (result.success) return result.data;

  // `fieldErrors` es `{}` para un ZodType genérico, así que se estrecha aquí.
  const fieldErrors = z.flattenError(result.error).fieldErrors as Record<
    string,
    string[] | undefined
  >;

  const missing = Object.entries(fieldErrors)
    .map(([name, errors]) => `  - ${name}: ${errors?.[0] ?? "inválida"}`)
    .join("\n");

  throw new Error(
    `Faltan variables de entorno o son inválidas:\n${missing}\n\n` +
      `Defínelas en ${where}. Los valores están en .env.example.`,
  );
}

// Next inlines NEXT_PUBLIC_* at build time only when referenced literally.
export const env = parseEnv(
  publicEnvSchema,
  {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
  "Vercel → Settings → Environment Variables (o .env.local en tu máquina)",
);
