"use server";

import { redirect } from "next/navigation";

import { getHouseholdId } from "@/shared/auth/session";
import { createClient } from "@/shared/supabase/server";

async function decide(
  formData: FormData,
  action: "approve" | "deny",
): Promise<string> {
  const authorizationId = String(formData.get("authorization_id") ?? "");
  if (!authorizationId) throw new Error("Falta el identificador de autorización.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Tener sesión no es tener acceso: aprobar aquí sin hogar daría un conector que
  // se conecta bien y luego no ve nada, que es peor que negarlo de frente.
  if (!(await getHouseholdId(user))) redirect("/no-access");

  // `authorization_id` viene de un campo oculto, o sea que no es de fiar — pero
  // Supabase lo valida contra la sesión de este usuario, así que uno manipulado
  // simplemente falla.
  const { data, error } =
    action === "approve"
      ? await supabase.auth.oauth.approveAuthorization(authorizationId)
      : await supabase.auth.oauth.denyAuthorization(authorizationId);

  if (error || !data?.redirect_url) {
    throw new Error(error?.message ?? "No se pudo resolver la autorización.");
  }
  return data.redirect_url;
}

// `redirect()` lanza NEXT_REDIRECT, así que va fuera de cualquier try/catch.
export async function approveAction(formData: FormData): Promise<void> {
  redirect(await decide(formData, "approve"));
}

export async function denyAction(formData: FormData): Promise<void> {
  redirect(await decide(formData, "deny"));
}
