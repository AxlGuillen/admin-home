import "server-only";

import { z } from "zod";

// Separate from env.ts: that file is evaluated in the client bundle, where these
// would be undefined and the parse would throw in the browser.
const serverEnvSchema = z.object({
  APP_URL: z.url(),
  MCP_OAUTH_CLIENT_IDS: z.string().optional(),
});

const serverEnv = serverEnvSchema.parse({
  APP_URL: process.env.APP_URL,
  MCP_OAUTH_CLIENT_IDS: process.env.MCP_OAUTH_CLIENT_IDS,
});

/** Origin without trailing slash. Never derived from the Host header, which is spoofable. */
export function appUrl(): string {
  return serverEnv.APP_URL.replace(/\/+$/, "");
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
