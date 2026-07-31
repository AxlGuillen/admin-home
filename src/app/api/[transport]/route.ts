import { mcpHandler } from "@/modules/mcp/server";

// nodejs, nunca edge: node:crypto y el SDK de MCP no corren en edge.
export const runtime = "nodejs";
// Literal a la fuerza: Next analiza los config de segmento estáticamente y una
// constante importada lo rompe con "Invalid segment configuration export".
// Debe coincidir con MAX_DURATION en @/modules/mcp/server.
export const maxDuration = 60;

export { mcpHandler as GET, mcpHandler as POST, mcpHandler as DELETE };
