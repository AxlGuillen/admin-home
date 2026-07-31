import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getHouseholdId } from "@/shared/auth/session";
import { createClient } from "@/shared/supabase/server";

import { approveAction, denyAction } from "./actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Autorizar conexión · Admin Home" };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 size-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[30px]"
        style={{
          background:
            "radial-gradient(circle,color-mix(in srgb,var(--brand) 22%,transparent),transparent 62%)",
        }}
      />
      <div className="text-ink-mut absolute top-6 left-8 flex items-center gap-2.5 font-mono text-[11px] font-bold tracking-[0.06em] uppercase">
        <span className="bg-brand block size-2 rounded-full" />
        ADMIN·HOME
      </div>
      <div className="m-base relative z-10 w-[min(440px,92vw)] px-9 pt-10 pb-8 shadow-[var(--sh-raise)]">
        {children}
      </div>
    </main>
  );
}

function ConsentError({ message }: { message: string }) {
  return (
    <Shell>
      <div className="text-brand-700 mb-3 font-mono text-[11px] font-bold tracking-[0.06em] uppercase">
        AUTORIZACIÓN
      </div>
      <h1 className="mb-1.5 text-[25px] leading-none tracking-[-0.025em]">
        No se pudo continuar
      </h1>
      <p className="text-ink-mut text-[12.5px]">{message}</p>
      <p className="text-ink-mut mt-4 text-[12.5px]">
        Vuelve a iniciar la conexión desde la aplicación que la pidió.
      </p>
    </Shell>
  );
}

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ authorization_id?: string | string[] }>;
}) {
  const raw = (await searchParams).authorization_id;
  const authorizationId = Array.isArray(raw) ? raw[0] : raw;
  if (!authorizationId) {
    return <ConsentError message="La solicitud llegó sin identificador de autorización." />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El proxy ya redirige; esto es defensa en profundidad, y tiene que conservar la
  // query o el flujo se muere al volver del login.
  if (!user) {
    const next = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  if (!(await getHouseholdId(user))) redirect("/no-access");

  const { data, error } =
    await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

  if (error || !data) {
    return <ConsentError message={error?.message ?? "La solicitud no es válida o ya expiró."} />;
  }

  // Sin `authorization_id` en la respuesta, el consentimiento ya estaba dado y
  // Supabase devuelve directo la URL de vuelta al cliente.
  if (!("authorization_id" in data)) redirect(data.redirect_url);

  return (
    <Shell>
      <div className="text-brand-700 mb-3 font-mono text-[11px] font-bold tracking-[0.06em] uppercase">
        AUTORIZACIÓN
      </div>
      <h1 className="mb-1.5 text-[25px] leading-none tracking-[-0.025em]">
        {data.client.name}
      </h1>
      <p className="text-ink-mut mb-6 text-[12.5px]">
        Quiere leer los datos financieros de tu hogar como{" "}
        <strong className="text-foreground font-semibold">{data.user.email}</strong>.
      </p>

      <ul className="text-ink-mut mb-6 space-y-2 text-[12.5px]">
        <li className="flex gap-2">
          <span className="bg-brand mt-[7px] block size-1.5 shrink-0 rounded-full" />
          Solo lectura: no puede crear, editar ni borrar nada.
        </li>
        <li className="flex gap-2">
          <span className="bg-brand mt-[7px] block size-1.5 shrink-0 rounded-full" />
          Ve exactamente lo mismo que ves tú en la app, ni más ni menos.
        </li>
        <li className="flex gap-2">
          <span className="bg-brand mt-[7px] block size-1.5 shrink-0 rounded-full" />
          Puedes revocarlo cuando quieras desde el panel de Supabase.
        </li>
      </ul>

      {/* Dos formularios en vez de un submitter con name/value: la intención va en
          qué acción corre, no en un campo que el navegador controla. */}
      <div className="flex gap-2">
        <form action={denyAction} className="flex-1">
          <input type="hidden" name="authorization_id" value={authorizationId} />
          <Button type="submit" variant="outline" className="w-full">
            Denegar
          </Button>
        </form>
        <form action={approveAction} className="flex-1">
          <input type="hidden" name="authorization_id" value={authorizationId} />
          <Button type="submit" className="w-full">
            Autorizar
          </Button>
        </form>
      </div>
    </Shell>
  );
}
