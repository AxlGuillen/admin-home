"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { ACTIVE_MODULES } from "@/shared/config/modules";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-3 pt-3">
        <div className="border-line bg-surface text-ink-mut flex items-center gap-2 rounded-[var(--r-el)] border px-2.5 py-2">
          <Search className="size-[15px] flex-none" strokeWidth={2} />
          <span className="text-xs">Buscar…</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        <p className="text-ink-mut px-3 pt-2 pb-2 font-mono text-[9px] font-bold tracking-[0.06em] uppercase">
          Módulos
        </p>
        {ACTIVE_MODULES.map((mod) => {
          const active =
            mod.href === "/" ? pathname === "/" : pathname.startsWith(mod.href);
          return (
            <Link
              key={mod.id}
              href={mod.href}
              className={cn(
                "flex items-center gap-3 rounded-[var(--r-el-sm)] px-3 py-2.5 text-[13px] transition-colors duration-[var(--dur-micro)]",
                active
                  ? "bg-brand font-bold text-white"
                  : "text-ink-2 hover:bg-line-2 font-semibold",
              )}
            >
              <mod.icon className="size-[17px]" strokeWidth={2} />
              {mod.label}
            </Link>
          );
        })}

        <p className="text-ink-mut px-3 pt-5 pb-2 font-mono text-[9px] font-bold tracking-[0.06em] uppercase">
          Próximamente
        </p>
        <div className="text-ink-mut-2 flex cursor-not-allowed items-center gap-3 px-3 py-2.5 text-[13px] font-semibold">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Inventario
        </div>
      </nav>
    </div>
  );
}
