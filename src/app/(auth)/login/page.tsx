import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar · Admin Home" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // Internal routes only: an absolute next URL would be an open redirect.
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/";

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
      <LoginForm next={safeNext} />
    </main>
  );
}
