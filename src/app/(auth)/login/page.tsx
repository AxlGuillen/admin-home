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
    <main className="flex min-h-svh items-center justify-center p-6">
      <LoginForm next={safeNext} />
    </main>
  );
}
