import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin Home",
  description: "Administración y registro de los ámbitos de la casa.",
  // Safari pide /apple-touch-icon.png por convención, pero solo si no hay <link>;
  // explícito no depende del fallback.
  icons: { apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Admin Home", statusBarStyle: "default" },
};

// Pinta el marco de la ventana instalada y la UI del navegador móvil. Va al
// canvas, no a la marca: el acento se concentra en la dominante (SKIN), no en
// el chrome. Sigue al sistema; si el toggle fuerza el otro tema, el marco no lo
// acompaña — limitación conocida de meta theme-color, no un bug nuestro.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fbfc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1319" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // next-themes escribe la clase del tema en <html> antes de hidratar.
    <html
      lang="es"
      suppressHydrationWarning
      className={`${archivo.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
