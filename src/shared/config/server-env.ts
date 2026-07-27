import "server-only";

import { z } from "zod";

import { parseEnv } from "./parse-env";

// Separate from env.ts: that file is evaluated in the client bundle, where these
// would be undefined and the parse would throw in the browser.
const serverEnvSchema = z.object({
  // Solo el origen. Pegar la URL de una página (".../login") produciría el
  // identificador ".../login/api/mcp", y el conector fallaría con un error que
  // no menciona la causa.
  APP_URL: z
    .url()
    // Zod v4 encadena los checks aunque `z.url()` ya haya fallado, así que un
    // valor que ni siquiera es URL llegaría hasta aquí y `new URL` reventaría.
    .refine((value) => {
      try {
        const { pathname, search, hash } = new URL(value);
        return pathname.replace(/\/+$/, "") === "" && !search && !hash;
      } catch {
        return true; // que el error lo dé `z.url()`, que es más claro
      }
    }, "debe ser solo el origen, sin ruta (https://tu-app.com, no https://tu-app.com/login)")
    .optional(),
  MCP_OAUTH_CLIENT_IDS: z.string().optional(),
});

const serverEnv = parseEnv(
  serverEnvSchema,
  {
    APP_URL: process.env.APP_URL,
    MCP_OAUTH_CLIENT_IDS: process.env.MCP_OAUTH_CLIENT_IDS,
  },
  "Vercel → Settings → Environment Variables (o .env.local en tu máquina)",
);

const stripSlash = (url: string) => url.replace(/\/+$/, "");

/**
 * Origen público de la app: el `resource` del MCP y la base del metadata OAuth.
 *
 * Nunca sale del header `Host`, que es suplantable. Se resuelve en tres pasos:
 *
 * 1. `APP_URL` si está — gana siempre, y es lo que hay que poner con dominio propio.
 * 2. `VERCEL_PROJECT_PRODUCTION_URL`, que Vercel inyecta sola y **siempre** define,
 *    incluso en previews. Apunta al dominio estable de producción, que es lo que un
 *    identificador de recurso OAuth necesita: si cambiara por deploy, el conector
 *    tendría que reautorizarse cada vez. Viene sin protocolo.
 * 3. localhost, para desarrollo.
 *
 * Ojo con el paso 2: en un preview, el identificador apunta a producción y no a la
 * URL del preview. Es deliberado —así el conector no se rompe cada deploy— pero
 * significa que el MCP solo funciona de verdad contra el dominio de producción.
 */
export function appUrl(): string {
  if (serverEnv.APP_URL) return stripSlash(serverEnv.APP_URL);

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${stripSlash(vercel)}`;

  return "http://localhost:3000";
}

/**
 * Which OAuth clients may reach the MCP endpoint. Supabase issues `aud: "authenticated"`
 * for every token in the project, and the project is shared with the ra_/adala_ apps, so
 * the audience proves nothing — this list is what actually narrows it down.
 */
export function allowedClientIds(): string[] {
  return (serverEnv.MCP_OAUTH_CLIENT_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}
