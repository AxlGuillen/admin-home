import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/shared/supabase/proxy";

/** Rutas accesibles sin sesión. */
const PUBLIC_PATHS = ["/login", "/signup", "/auth"];

/**
 * En Next 16 esto se llama Proxy; antes era `middleware.ts`. Refresca el token de
 * Supabase en cada request y hace la redirección optimista a /login.
 *
 * Es un atajo de UX, no una barrera de seguridad — de eso se encarga RLS.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
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
    /*
     * Todo excepto assets estáticos e imágenes, que no necesitan sesión y
     * pagarían el costo del refresh en cada request.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
