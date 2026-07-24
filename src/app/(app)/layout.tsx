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
      <aside className="bg-sidebar border-line flex w-[var(--sidebar-w)] flex-none flex-col border-r">
        <div className="border-line flex items-center gap-2.5 border-b px-5 py-5">
          <span className="bg-brand grid size-6 place-items-center rounded-[var(--r-el-sm)]">
            <span className="block size-2 rounded-full bg-white" />
          </span>
          <span className="text-[17px] font-extrabold tracking-[-0.01em]">
            Admin Home
          </span>
        </div>

        <SidebarNav />

        <div className="space-y-2 p-3">
          <ThemeToggle />
          {/* Pie de sidebar: card oscura con el bisel de dial detrás del avatar. */}
          <div className="m-dark m-bezel flex items-center gap-2.5 p-3">
            <span className="relative grid size-8 flex-none place-items-center rounded-full bg-white/10 font-mono text-[12px] font-bold text-white">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-dark-fg nm text-[12px] font-semibold">
                {user.email}
              </p>
              <span className="text-dark-fg/55 font-mono text-[9px] tracking-[0.04em] uppercase">
                Sesión activa
              </span>
            </div>
            <form action={signOut}>
              <Button
                variant="ghost"
                size="icon"
                type="submit"
                aria-label="Salir"
                title="Salir"
                className="text-dark-fg/70 size-8 flex-none rounded-[var(--r-el-sm)] hover:bg-white/10 hover:text-white"
              >
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <main className="h-svh min-w-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-[1080px] px-8 pt-8 pb-16">{children}</div>
      </main>
    </div>
  );
}
