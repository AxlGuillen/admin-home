"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

function toggle() {
  const next = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", next);
  localStorage.setItem("theme", next ? "dark" : "light");
}

export function ThemeToggle() {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={toggle}
      className="w-full justify-start gap-2.5 rounded-none"
    >
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
      <span className="dark:hidden">Tema oscuro</span>
      <span className="hidden dark:block">Tema claro</span>
    </Button>
  );
}
