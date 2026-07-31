import { z } from "zod";

/**
 * Falla ruidosamente y con instrucciones.
 *
 * Vive aparte de `env.ts` a propósito: ese archivo corre su propio parse al
 * importarse, así que quien solo quiera el helper acabaría arrastrando esa
 * validación —y sus variables— sin pedirlo.
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
