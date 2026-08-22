import type { MetadataRoute } from "next";

// Next lo sirve en /manifest.webmanifest y lo enlaza solo. El navegador lo
// pide SIN cookies: por eso está excluido del matcher en proxy.ts — dentro del
// matcher respondía 307 a /login y la instalación fallaba en silencio.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Admin Home",
    short_name: "Admin Home",
    description: "Administración y registro de los ámbitos de la casa.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fbfc",
    theme_color: "#0a9fd4",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
