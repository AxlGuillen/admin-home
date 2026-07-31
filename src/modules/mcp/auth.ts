import { createHash } from "node:crypto";

import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

import { allowedClientIds } from "@/shared/config/server-env";

import type { McpIdentity } from "./context";
import { clientForToken, verifierClient } from "./supabase";

type CachedIdentity = McpIdentity & { expiresAt: number };

// Amortiza el round trip a GoTrue: una pregunta del LLM encadena varias
// herramientas y no tiene sentido revalidar en cada una. El precio es que revocar
// tarda hasta este tiempo en surtir efecto; es el número que hay que mover si
// alguna vez importa más cortar rápido que la latencia.
const TTL_MS = 60_000;
const MAX_ENTRIES = 16;

const cache = new Map<string, { at: number; identity: Promise<CachedIdentity | null> }>();

/** El token nunca se usa como clave en claro: un log o un heap dump lo expondría. */
function fingerprint(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

/** Solo seguro DESPUÉS de que getUser probó que el token es genuino. */
function claims(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  if (!payload) return {};
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return {};
  }
}

// Un 401 sin motivo es el fallo silencioso que este servidor promete no tener.
// Se registra en qué puerta se cayó, nunca el token. Solo va a los logs de Vercel.
function reject(reason: string, detail?: Record<string, unknown>): null {
  console.warn("[mcp] token rechazado:", reason, detail ?? "");
  return null;
}

async function identify(token: string): Promise<CachedIdentity | null> {
  const { data, error } = await verifierClient().auth.getUser(token);
  if (error || !data.user) {
    return reject("getUser falló", { error: error?.message });
  }

  const payload = claims(token);
  const clientId = typeof payload.client_id === "string" ? payload.client_id : "";

  // Un token de sesión normal de la app web no trae `client_id`: no pasó por el
  // consentimiento, así que no abre el conector.
  if (!clientId) return reject("el token no trae client_id");

  const allowed = allowedClientIds();
  if (allowed.length && !allowed.includes(clientId)) {
    return reject("client_id fuera del allowlist", {
      tokenClientId: clientId,
      allowlist: allowed,
    });
  }

  // Tener sesión no es tener acceso: auth.users es compartido con las apps ra_ y
  // adala_. La lectura va por RLS con el propio token de quien llama.
  const { data: rows, error: membershipError } = await clientForToken(token)
    .from("home_household_members")
    .select("household_id")
    .eq("user_id", data.user.id);

  if (membershipError) throw new Error(membershipError.message);
  if (!rows?.length) {
    return reject("el usuario no pertenece a ningún hogar", { user: data.user.email });
  }

  const householdIds = rows.map((r) => r.household_id).sort();

  return {
    userId: data.user.id,
    email: data.user.email ?? null,
    clientId,
    householdKey: householdIds.join(","),
    expiresAt: typeof payload.exp === "number" ? payload.exp : 0,
  };
}

function identityFor(token: string): Promise<CachedIdentity | null> {
  const key = fingerprint(token);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.identity;

  const pending = identify(token);
  cache.set(key, { at: Date.now(), identity: pending });
  pending.catch(() => {
    if (cache.get(key)?.identity === pending) cache.delete(key);
  });

  for (const stale of cache.keys()) {
    if (cache.size <= MAX_ENTRIES) break;
    cache.delete(stale);
  }
  return pending;
}

/**
 * Devolver `undefined` es lo que hace que `withMcpAuth` conteste 401 con el header
 * `WWW-Authenticate` apuntando al metadata del recurso. Sin ese header ningún
 * cliente MCP puede descubrir el authorization server, así que el conector no
 * arrancaría nunca.
 */
export async function verifyToken(
  _req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;

  const identity = await identityFor(bearerToken);
  if (!identity) return undefined;

  const { expiresAt, ...rest } = identity;

  return {
    token: bearerToken,
    clientId: identity.clientId,
    // Los access tokens de Supabase no llevan claim `scope`, así que exigir scopes
    // daría 403 siempre. `requiredScopes` queda sin poner, a juego con esto.
    scopes: [],
    expiresAt,
    // Sin `resource`: Supabase emite `aud: "authenticated"`, o sea que no hubo
    // validación de audiencia RFC 8707 y afirmarla aquí sería mentir.
    extra: { ...rest } satisfies McpIdentity,
  };
}

/** Solo para los tests: la caché vive en el módulo y se filtraría entre casos. */
export function resetIdentityCache(): void {
  cache.clear();
}
