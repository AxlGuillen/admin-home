"use client";

import { useState } from "react";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { signOut } from "@/app/(auth)/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { SidebarNav } from "./sidebar-nav";
import { SIDEBAR_COOKIE } from "./sidebar-state";

const ONE_YEAR = 60 * 60 * 24 * 365;

export function AppSidebar({
  email,
  initial,
  defaultCollapsed,
}: {
  email: string;
  initial: string;
  defaultCollapsed: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  // La cookie es para que el Server Component pinte el ancho correcto en el
  // primer paint; el estado local evita esperar al servidor para animar.
  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  };

  return (
    <aside
      id="app-sidebar"
      data-collapsed={collapsed}
      className="bg-sidebar border-line flex w-[var(--sidebar-w)] flex-none flex-col border-r transition-[width] duration-[var(--dur-panel)] ease-[var(--ease)] motion-reduce:transition-none data-[collapsed=true]:w-[var(--sidebar-w-rail)]"
    >
      <div
        className={cn(
          "border-line flex items-center border-b py-5",
          collapsed ? "justify-center px-3" : "gap-2.5 px-5",
        )}
      >
        {collapsed ? (
          // En el riel no caben marca y botón en la misma fila, así que la marca
          // ES el botón: siempre visible y siempre tocable (con hover no basta,
          // en pantalla táctil no existe).
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggle}
                aria-label="Expandir el menú"
                aria-expanded={false}
                aria-controls="app-sidebar"
                className="group/mark relative grid size-7 place-items-center rounded-[var(--r-el-sm)]"
              >
                <span className="bg-brand grid size-6 place-items-center rounded-[var(--r-el-sm)] transition-opacity duration-[var(--dur-micro)] group-focus-visible/mark:opacity-0 group-hover/mark:opacity-0">
                  <span className="block size-2 rounded-full bg-white" />
                </span>
                <PanelLeftOpen
                  aria-hidden
                  strokeWidth={2}
                  className="text-ink-2 absolute size-[17px] opacity-0 transition-opacity duration-[var(--dur-micro)] group-focus-visible/mark:opacity-100 group-hover/mark:opacity-100"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Expandir el menú</TooltipContent>
          </Tooltip>
        ) : (
          <>
            <span className="bg-brand grid size-6 flex-none place-items-center rounded-[var(--r-el-sm)]">
              <span className="block size-2 rounded-full bg-white" />
            </span>
            <span className="nm text-[17px] font-extrabold tracking-[-0.01em]">
              Admin Home
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggle}
                  aria-label="Colapsar el menú"
                  aria-expanded
                  aria-controls="app-sidebar"
                  className="text-ink-mut hover:bg-line-2 hover:text-ink-2 ml-auto grid size-7 flex-none place-items-center rounded-[var(--r-el-sm)] transition-colors duration-[var(--dur-micro)]"
                >
                  <PanelLeftClose className="size-[17px]" strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Colapsar el menú</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      <SidebarNav collapsed={collapsed} />

      <div className={cn("space-y-2", collapsed ? "p-2" : "p-3")}>
        <ThemeToggle compact={collapsed} />

        {/* Pie de sidebar: card oscura con el bisel de dial detrás del avatar.
            El dial mide 74px y no cabe en el riel, así que ahí no se pone. */}
        <div
          className={cn(
            "m-dark flex items-center gap-2.5",
            collapsed ? "flex-col p-2" : "m-bezel p-3",
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="relative grid size-8 flex-none place-items-center rounded-full bg-white/10 font-mono text-[12px] font-bold text-white">
                {initial}
              </span>
            </TooltipTrigger>
            <TooltipContent side="right">{email}</TooltipContent>
          </Tooltip>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-dark-fg nm text-[12px] font-semibold">{email}</p>
              <span className="text-dark-fg/70 font-mono text-[9px] tracking-[0.04em] uppercase">
                Sesión activa
              </span>
            </div>
          )}

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
  );
}
