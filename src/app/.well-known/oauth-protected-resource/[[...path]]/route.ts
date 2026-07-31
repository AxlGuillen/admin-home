import { metadataCorsOptionsRequestHandler, protectedResourceHandler } from "mcp-handler";

import { mcpResourceUrl, supabaseAuthIssuer } from "@/modules/mcp";
import { env } from "@/shared/config/env";
import { appUrl } from "@/shared/config/server-env";

export const runtime = "nodejs";

// Catch-all opcional a propósito: los clientes MCP piden el metadata tanto en la
// raíz como en `/.well-known/oauth-protected-resource/api/mcp`, y una ruta fija
// solo respondería a una de las dos.
export const GET = (request: Request) =>
  protectedResourceHandler({
    authServerUrls: [supabaseAuthIssuer(env.NEXT_PUBLIC_SUPABASE_URL)],
    resourceUrl: mcpResourceUrl(appUrl()),
  })(request);

export const OPTIONS = metadataCorsOptionsRequestHandler();
