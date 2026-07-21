import Link from "next/link";

import { signOut } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { requireHousehold } from "@/shared/auth/session";
import { ACTIVE_MODULES } from "@/shared/config/modules";

// requireHousehold() gates every child, so pages here don't recheck — only Server Actions do.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireHousehold();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center gap-6 border-b px-6 py-3">
        <Link href="/" className="font-semibold">
          Admin Home
        </Link>

        <nav className="flex items-center gap-1">
          {ACTIVE_MODULES.map((mod) => (
            <Button key={mod.id} variant="ghost" size="sm" asChild>
              <Link href={mod.href}>
                <mod.icon />
                {mod.label}
              </Link>
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-muted-foreground hidden text-sm sm:inline">
            {user.email}
          </span>
          <form action={signOut}>
            <Button variant="outline" size="sm" type="submit">
              Salir
            </Button>
          </form>
        </div>
      </header>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
