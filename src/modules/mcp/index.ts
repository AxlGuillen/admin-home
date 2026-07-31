/**
 * Contrato público del módulo. Seguro en cliente y servidor: aquí solo van
 * constantes de ruta. El transporte y la verificación del token viven en
 * `server.ts`, que importa `server-only`.
 */
export const MCP_PATH = "/api/mcp";

/** RFC 9728. Lo anuncia el 401 para que el cliente descubra el authorization server. */
export const PROTECTED_RESOURCE_PATH = "/.well-known/oauth-protected-resource";

/** Identificador del recurso. El origen sale de APP_URL, nunca del header Host. */
export function mcpResourceUrl(origin: string): string {
  return `${origin.replace(/\/+$/, "")}${MCP_PATH}`;
}

/** Issuer del servidor OAuth de Supabase; coincide con el claim `iss` de sus tokens. */
export function supabaseAuthIssuer(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/+$/, "")}/auth/v1`;
}
