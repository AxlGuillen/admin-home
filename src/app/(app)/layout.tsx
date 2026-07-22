import { LogOut } from "lucide-react";

import { signOut } from "@/app/(auth)/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { requireHousehold } from "@/shared/auth/session";

import { SidebarNav } from "./sidebar-nav";

// requireHousehold() gates every child, so pages here don't recheck — only Server Actions do.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireHousehold();
  const initial = (user.email ?? "U").charAt(0).toUpperCase();

  return (
    <div className="flex h-svh overflow-hidden">
      <aside className="bg-sidebar border-divider elev-md relative z-10 flex w-[250px] flex-none flex-col border-r">
        <div className="border-divider flex items-center gap-2.5 border-b px-5 py-5">
          <span className="border-primary block size-[11px] flex-none border-2" />
          <span className="font-[family-name:var(--font-barlow-condensed)] text-lg tracking-[0.02em]">
            Admin Home
          </span>
        </div>

        <SidebarNav />

        <div className="border-divider flex flex-col gap-3 border-t p-3.5">
          <ThemeToggle />
          <div className="flex items-center gap-2.5">
            <span className="border-divider text-primary grid size-[30px] flex-none place-items-center border font-[family-name:var(--font-barlow-condensed)] text-[13px]">
              {initial}
            </span>
            <span className="text-muted-foreground flex-1 truncate text-xs">
              {user.email}
            </span>
            <form action={signOut}>
              <Button
                variant="secondary"
                size="icon"
                type="submit"
                aria-label="Salir"
                title="Salir"
                className="size-9 flex-none rounded-none"
              >
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <main className="grid-bg h-svh min-w-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-[980px] px-11 pt-10 pb-18">{children}</div>
      </main>
    </div>
  );
}
