import { cookies } from "next/headers";

import { requireHousehold } from "@/shared/auth/session";

import { AppSidebar } from "./app-sidebar";
import { SIDEBAR_COOKIE } from "./sidebar-state";

// requireHousehold() gates every child, so pages here don't recheck — only Server Actions do.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireHousehold();
  const initial = (user.email ?? "U").charAt(0).toUpperCase();

  // Se lee en el servidor para que el ancho salga bien en el primer paint; con
  // localStorage se vería el salto de 260px a 68px en cada navegación.
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "1";

  return (
    <div className="flex h-svh overflow-hidden">
      <AppSidebar
        email={user.email ?? ""}
        initial={initial}
        defaultCollapsed={collapsed}
      />

      <main className="h-svh min-w-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-[1080px] px-8 pt-8 pb-16">{children}</div>
      </main>
    </div>
  );
}
