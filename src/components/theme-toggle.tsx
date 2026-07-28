"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  // `resolvedTheme` es undefined antes de montar, pero solo se lee dentro del
  // handler: así el botón no necesita estado y no hay mismatch de hidratación.
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Cambiar el tema"
      title={compact ? "Cambiar el tema" : undefined}
      className={cn(
        "border-line bg-surface text-ink-2 hover:bg-line-2 flex items-center rounded-[var(--r-el)] border text-[12px] font-semibold transition-colors duration-[var(--dur-micro)]",
        compact ? "h-9 w-full justify-center" : "w-full gap-2.5 px-3 py-2",
      )}
    >
      <Moon className="size-4 flex-none dark:hidden" strokeWidth={2} />
      <Sun className="hidden size-4 flex-none dark:block" strokeWidth={2} />
      {!compact && (
        <>
          <span className="dark:hidden">Tema oscuro</span>
          <span className="hidden dark:block">Tema claro</span>
        </>
      )}
    </button>
  );
}
