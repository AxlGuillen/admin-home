# Plan · Instalable como app (sin offline)

> Objetivo: que la familia pueda anclar Admin Home como app — sobre todo en
> escritorio (Chrome/Edge → icono de instalar en la barra; Safari macOS → "Añadir
> al Dock"), y de paso en el teléfono. **Sin caché offline a propósito**: cero
> paquetes, cero service worker, cero cambio en el flujo de desarrollo.

## Decisiones ya tomadas

- **Sin paquete y sin service worker.** `next-pwa` está muerto (2022),
  `@ducanh2912/next-pwa` estancado, y Serwist exige salir de Turbopack. Todos
  resuelven offline, que no se necesita. Chrome de escritorio ya no exige
  service worker para instalar: manifest válido + HTTPS bastan, y Vercel pone
  el HTTPS.
- **Sin caché = sin riesgos.** Nada de datos financieros en Cache Storage
  sobreviviendo al logout, nada de "sigo viendo la versión vieja", nada que
  interfiera con las rutas OAuth del MCP (`/api/[transport]`,
  `/.well-known/*`). Cada apertura es la app viva.
- **`display: "standalone"`.** Ventana propia sin chrome del navegador. En
  escritorio hay controles de ventana; en Android no hay botón atrás, pero el
  sidebar ya es la navegación.

## Fases

### Fase 1 · Manifest

`src/app/manifest.ts` con la convención nativa del App Router
(`MetadataRoute.Manifest`) — Next lo sirve en `/manifest.webmanifest` y lo
enlaza solo. Campos: `name`/`short_name` "Admin Home", `id` y `start_url` `/`,
`display: "standalone"`, `background_color` = canvas claro, `theme_color` =
`#0A9FD4` (pinta la barra de título de la ventana instalada), iconos 192/512 +
variantes maskable.

**La trampa conocida:** el matcher de `proxy.ts` excluye assets por extensión
(`svg|png|…|avif`) pero no `manifest.webmanifest` ni `.ico`. El navegador pide
el manifest **sin cookies**, así que hoy respondería un 307 a `/login` y la
instalación fallaría — el mismo bug que ya pasó con las texturas `.avif`. Hay
que sumar ambos al matcher.

### Fase 2 · Iconos

No existen (solo el `favicon.ico` por defecto). Se generan desde la marca — el
cuadro cian `--brand` con el punto blanco, mismo radio anidado del sidebar:

| Archivo | Uso |
| --- | --- |
| `public/icon-192.png`, `icon-512.png` | manifest, `purpose: "any"` |
| `public/icon-maskable-512.png` | Android: la marca al ~60% con margen de seguridad, fondo `--brand` pleno |
| `public/apple-touch-icon.png` (180px) | iOS/macOS: esquinas cuadradas, iOS las redondea |

Fuente: un SVG de la marca y render a PNG con `sharp` (ya está en
`node_modules` vía Next) en un script de un solo uso; el SVG se queda en el
repo por si cambia la marca.

### Fase 3 · Metadata

En el root layout: `appleWebApp` (título y `capable`) para que "Añadir a
inicio" en iOS se vea bien, y el export `viewport` con `themeColor` — dos
valores con `prefers-color-scheme` para que el marco siga el tema del sistema.
Hoy no existe ningún export `viewport`, así que es agregar, no tocar.

### Fase 4 · Verificación

- `curl` al manifest **sin cookies** → 200 y `content-type` correcto (la
  regresión del matcher).
- DevTools → Application → Manifest: sin advertencias, iconos visibles,
  maskable bien recortado.
- Chrome escritorio: aparece el icono de instalar en la omnibox; instalada,
  abre en ventana propia con el `theme_color`.
- Logout dentro de la app instalada → cae a `/login` dentro de la misma
  ventana (no se abre el navegador).

## Qué NO cubre, a propósito

- **Offline**: la app instalada sin red muestra el error de red del sistema.
  Si algún día se quiere, la puerta es un service worker corto que cachee solo
  `/_next/static` y assets — nunca HTML ni API — o Serwist si se acepta volver
  a webpack. Decisión para entonces, no para ahora.
- **Push notifications**: piden service worker + VAPID + tabla de
  suscripciones. Fuera de alcance hasta que exista un caso real (¿recordatorio
  de pago?).
- **Prompt de instalación propio** (`beforeinstallprompt`): no funciona en
  Safari y el flujo nativo del navegador basta para 4 personas.
