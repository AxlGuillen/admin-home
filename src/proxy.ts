import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/shared/supabase/proxy";

const PUBLIC_PATHS = ["/login", "/signup", "/auth"];

// Optimistic redirect for UX, not a security barrier; RLS handles that.
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    // Con la query: /oauth/consent lleva el `authorization_id` y sin él el usuario
    // vuelve del login a una pantalla que ya no sabe qué estaba autorizando.
    const target = `${pathname}${request.nextUrl.search}`;
    url.pathname = "/login";
    url.search = ""; // clone() arrastra la query original; sin limpiarla se duplica
    if (target !== "/") url.searchParams.set("next", target);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static assets, the MCP transports and the OAuth discovery documents: those
    // authenticate in their own handler, and a redirect to /login would replace the 401
    // that clients need to discover the authorization server. /oauth/consent stays in.
    // manifest.webmanifest is fetched WITHOUT cookies: behind the proxy it 307'd to /login and install broke.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|\\.well-known|api/mcp|api/sse|api/message|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
