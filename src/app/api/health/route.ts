import { mcpResourceUrl, MCP_PATH, supabaseAuthIssuer } from "@/modules/mcp";
import { env } from "@/shared/config/env";
import { appUrl } from "@/shared/config/server-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 5_000;

type Check = { name: string; ok: boolean; detail: string };

async function get(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
}

/**
 * El servidor OAuth de Supabase está en beta y se enciende con un toggle del
 * dashboard: si alguien lo apaga, el conector muere sin que nada en este repo
 * cambie. Este check es lo que convierte eso en algo visible.
 */
async function oauthServer(): Promise<Check> {
  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/.well-known/oauth-authorization-server/auth/v1`;
  try {
    const res = await get(url);
    if (!res.ok) {
      return {
        name: "oauth_server",
        ok: false,
        detail: `discovery ${res.status}: el servidor OAuth de Supabase está apagado`,
      };
    }
    const body = (await res.json()) as { issuer?: string };
    const expected = supabaseAuthIssuer(env.NEXT_PUBLIC_SUPABASE_URL);
    return {
      name: "oauth_server",
      ok: body.issuer === expected,
      detail: body.issuer === expected ? "issuer correcto" : `issuer inesperado: ${body.issuer}`,
    };
  } catch (error) {
    return { name: "oauth_server", ok: false, detail: String(error) };
  }
}

/**
 * El check más valioso: sin el `resource_metadata` en el 401, ningún cliente MCP
 * puede descubrir el authorization server, y el conector falla con un error que no
 * dice por qué. También atrapa un fail-open, que sería mucho peor.
 */
async function mcpRejectsAnonymous(): Promise<Check> {
  try {
    const res = await get(`${appUrl()}${MCP_PATH}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });

    if (res.status !== 401) {
      return { name: "mcp_unauthenticated", ok: false, detail: `esperaba 401, dio ${res.status}` };
    }
    const header = res.headers.get("www-authenticate") ?? "";
    return {
      name: "mcp_unauthenticated",
      ok: header.includes("resource_metadata"),
      detail: header.includes("resource_metadata")
        ? "401 con resource_metadata"
        : "el 401 no trae resource_metadata: los conectores no pueden descubrir OAuth",
    };
  } catch (error) {
    return { name: "mcp_unauthenticated", ok: false, detail: String(error) };
  }
}

async function protectedResource(): Promise<Check> {
  try {
    const res = await get(`${appUrl()}/.well-known/oauth-protected-resource`);
    const body = (await res.json()) as { resource?: string };
    const expected = mcpResourceUrl(appUrl());
    return {
      name: "protected_resource",
      ok: res.ok && body.resource === expected,
      detail: body.resource === expected ? "recurso correcto" : `recurso inesperado: ${body.resource}`,
    };
  } catch (error) {
    return { name: "protected_resource", ok: false, detail: String(error) };
  }
}

export async function GET() {
  const checks = await Promise.all([
    oauthServer(),
    protectedResource(),
    mcpRejectsAnonymous(),
  ]);

  const ok = checks.every((c) => c.ok);
  return Response.json(
    { status: ok ? "ok" : "down", checkedAt: new Date().toISOString(), checks },
    { status: ok ? 200 : 503 },
  );
}
