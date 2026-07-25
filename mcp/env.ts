import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { z } from "zod";

// Este proceso corre fuera de Next, que es quien normalmente carga `.env.local`.
// La ruta se resuelve desde este archivo y no desde `process.cwd()`, porque el
// cliente MCP lanza el comando desde el directorio que se le antoje.
function fileEnv(name: string): Record<string, string> {
  const path = fileURLToPath(new URL(`../${name}`, import.meta.url));
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return {};
  }

  const values: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    values[match[1]] = match[2].trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  return values;
}

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const parsed = envSchema.safeParse({
  ...fileEnv(".env"),
  ...fileEnv(".env.local"),
  ...process.env,
});

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(
    `Faltan variables de entorno para el MCP (${missing}). Copia .env.example a .env.local.`,
  );
}

export const env = parsed.data;
