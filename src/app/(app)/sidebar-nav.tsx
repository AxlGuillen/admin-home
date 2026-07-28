"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ACTIVE_MODULES } from "@/shared/config/modules";

/** En riel el label no se ve: sin tooltip el icono queda sin nombre. */
function Labelled({
  collapsed,
  label,
  children,
}: {
  collapsed: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (!collapsed) return children;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col">
      <nav
        className={cn(
          "flex flex-1 flex-col gap-0.5",
          collapsed ? "p-2 pt-3" : "p-3",
        )}
      >
        {!collapsed && (
          <p className="text-ink-mut px-3 pt-2 pb-2 font-mono text-[9px] font-bold tracking-[0.06em] uppercase">
            Módulos
          </p>
        )}
        {ACTIVE_MODULES.map((mod) => {
          const active =
            mod.href === "/" ? pathname === "/" : pathname.startsWith(mod.href);
          return (
            <Labelled key={mod.id} collapsed={collapsed} label={mod.label}>
              <Link
                href={mod.href}
                // El tooltip da la etiqueta visual, no el nombre accesible: sin
                // esto el riel es una columna de enlaces sin nombre.
                aria-label={collapsed ? mod.label : undefined}
                className={cn(
                  "flex items-center rounded-[var(--r-el-sm)] text-[13px] transition-colors duration-[var(--dur-micro)]",
                  collapsed ? "h-10 justify-center" : "gap-3 px-3 py-2.5",
                  active
                    ? "bg-brand font-bold text-white"
                    : "text-ink-2 hover:bg-line-2 font-semibold",
                )}
              >
                <mod.icon className="size-[17px] flex-none" strokeWidth={2} />
                {!collapsed && mod.label}
              </Link>
            </Labelled>
          );
        })}

        {!collapsed && (
          <p className="text-ink-mut px-3 pt-5 pb-2 font-mono text-[9px] font-bold tracking-[0.06em] uppercase">
            Próximamente
          </p>
        )}
        <Labelled collapsed={collapsed} label="Inventario · próximamente">
          <div
            className={cn(
              "text-ink-mut-2 flex cursor-not-allowed items-center text-[13px] font-semibold",
              collapsed ? "mt-3 h-10 justify-center" : "gap-3 px-3 py-2.5",
            )}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-none"
            >
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            {!collapsed && "Inventario"}
          </div>
        </Labelled>
      </nav>
    </div>
  );
}
