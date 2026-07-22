"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { ACTIVE_MODULES } from "@/shared/config/modules";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-0.5 p-3">
      <p className="text-muted-foreground px-3.5 pt-1.5 pb-2 font-[family-name:var(--font-barlow-condensed)] text-[10px] tracking-[0.16em]">
        MÓDULOS
      </p>
      {ACTIVE_MODULES.map((mod) => {
        const active =
          mod.href === "/" ? pathname === "/" : pathname.startsWith(mod.href);
        return (
          <Link
            key={mod.id}
            href={mod.href}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 font-[family-name:var(--font-barlow-condensed)] text-[15px] transition-colors",
              active
                ? "text-primary bg-[color-mix(in_srgb,var(--accent-solid)_14%,transparent)] shadow-[inset_3px_0_0_var(--accent-solid)]"
                : "hover:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)]",
            )}
          >
            <mod.icon className="size-[18px]" strokeWidth={1.5} />
            {mod.label}
          </Link>
        );
      })}
      <p className="text-muted-foreground px-3.5 pt-4.5 pb-2 font-[family-name:var(--font-barlow-condensed)] text-[10px] tracking-[0.16em]">
        PRÓXIMAMENTE
      </p>
      <div className="text-muted-foreground/70 flex cursor-not-allowed items-center gap-3 px-3.5 py-2.5 font-[family-name:var(--font-barlow-condensed)] text-[15px]">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="10" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Inventario
      </div>
    </nav>
  );
}
