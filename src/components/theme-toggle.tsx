"use client";

import { Moon, Sun } from "lucide-react";

function toggle() {
  const next = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", next);
  localStorage.setItem("theme", next ? "dark" : "light");
}

export function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggle}
      className="border-line bg-surface text-ink-2 hover:bg-line-2 flex w-full items-center gap-2.5 rounded-[var(--r-el)] border px-3 py-2 text-[12px] font-semibold transition-colors duration-[var(--dur-micro)]"
    >
      <Moon className="size-4 dark:hidden" strokeWidth={2} />
      <Sun className="hidden size-4 dark:block" strokeWidth={2} />
      <span className="dark:hidden">Tema oscuro</span>
      <span className="hidden dark:block">Tema claro</span>
    </button>
  );
}
