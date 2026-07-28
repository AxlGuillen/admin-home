"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// Inyecta el script que aplica la clase antes del primer paint; sin él, cada
// recarga da un destello claro antes de leer la preferencia guardada.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
