<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Admin Home

App personal para administrar distintos ámbitos de la casa. **Monolito modular**: un solo
deploy de Next.js, dominios aislados en `src/modules/*`.

Stack: Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind v4 ·
shadcn/ui (base radix, preset nova) · Supabase (Postgres + Auth + RLS) · Zod v4 · Vitest.

Idioma: **código y nombres de archivo en inglés, UI y comentarios de dominio en español.**

## Regla de oro

Antes de escribir código, lee el `CLAUDE.md` del módulo en el que vas a trabajar
(`src/modules/<modulo>/CLAUDE.md`). Contiene el contrato y las reglas específicas de ese dominio.

## Mapa del repo

```
src/
  app/                     Routing puro. Sin lógica de negocio.
    (auth)/                Rutas públicas: login, signup, etc.
    (app)/                 Rutas protegidas. Su layout exige sesión.
  modules/                 Un directorio por dominio. AQUÍ vive la lógica.
    _template/             Plantilla para crear un módulo nuevo. No se importa.
    finance/               Módulo 1: tarjetas y pagos.
  shared/                  Infra transversal. No conoce ningún módulo.
    supabase/              Clientes de Supabase + tipos generados de la BD.
    auth/                  Helpers de sesión.
    config/                Env validado con Zod, registro de módulos.
  components/ui/           shadcn/ui. Generado por CLI — no editar a mano.
  hooks/                   Hooks genéricos de UI.
  lib/                     Utilidades puras sin dependencias.
supabase/migrations/       Migraciones SQL versionadas.
proxy.ts                   Refresco de sesión (era `middleware.ts` antes de Next 16).
docs/architecture.md       Por qué está armado así.
```

## Anatomía de un módulo

Todo módulo en `src/modules/<nombre>/` tiene esta forma:

| Archivo             | Qué va aquí                                                          |
| ------------------- | -------------------------------------------------------------------- |
| `index.ts`          | **Único punto de entrada público.** Re-exporta lo que otros pueden usar. |
| `schemas.ts`        | Esquemas Zod. **Fuente de verdad** de los tipos del dominio.          |
| `types.ts`          | Tipos inferidos de los schemas + tipos de fila de la BD.              |
| `queries.ts`        | Lecturas (server-only). Devuelven datos ya tipados.                   |
| `actions.ts`        | Server Actions (`"use server"`). Escrituras. Validan con Zod SIEMPRE. |
| `components/`       | Componentes de UI del dominio.                                        |
| `CLAUDE.md`         | Contrato y reglas del módulo. Léelo antes de tocar el módulo.          |
| `*.test.ts`         | Tests unitarios junto al archivo que prueban.                         |

## Reglas de dependencia (ESLint las hace cumplir)

```
app  →  modules (vía index.ts) · shared · components/ui · hooks · lib
module →  shared · components/ui · hooks · lib · otro módulo SOLO vía su index.ts
shared →  shared · lib
lib    →  lib          (funciones puras, cero imports del proyecto)
```

Nunca importes `@/modules/finance/queries` desde fuera de `finance`. Usa `@/modules/finance`.
Si necesitas algo que `index.ts` no exporta, expórtalo ahí primero — de forma explícita.

## Reglas no negociables

1. **Zod primero.** Un campo nuevo se define en `schemas.ts` antes que en la BD o el form.
   El tipo se infiere con `z.infer`, nunca se escribe a mano.
2. **Toda Server Action valida su input con Zod** antes de tocar la BD. Sin excepciones.
3. **RLS siempre.** Cada tabla `home_*` tiene RLS activo y política ligada a `auth.uid()`.
   El código nunca es la única barrera de seguridad.
4. **Nada de service_role en el cliente.** La app solo usa la publishable key.
5. **Prefijo `home_` en todas las tablas.** La BD de Supabase es compartida con otros
   proyectos (`ra_`, `adala_`). Sin prefijo hay colisión.
6. **Server Components por defecto.** `"use client"` solo en hojas que necesiten estado o eventos.
7. **`npm run typecheck` y `npm run lint` deben pasar** antes de dar una tarea por terminada.
8. **Dinero en centavos** (`integer`), nunca `float`. Moneda explícita en cada monto.

## Comandos

| Comando               | Qué hace                                                     |
| --------------------- | ------------------------------------------------------------ |
| `npm run dev`         | Dev server (Turbopack).                                      |
| `npm run typecheck`   | `tsc --noEmit`.                                              |
| `npm run lint`        | ESLint, incluye los límites entre módulos.                   |
| `npm test`            | Vitest en modo watch.                                        |
| `npm run test:run`    | Vitest una sola pasada (usa este en CI o al verificar).      |
| `npm run db:types`    | Regenera `src/shared/supabase/database.types.ts` desde la BD. |

## Base de datos

Proyecto Supabase: **Axl-Projects** (`impscwgourdxhdejwkhe`), compartido con otras apps.

Las migraciones viven en `supabase/migrations/` con nombre `NNN_descripcion.sql`. Al crear una:
escribe el archivo primero, aplícala después, y **regenera los tipos** con `npm run db:types`.

## Crear un módulo nuevo

1. `cp -r src/modules/_template src/modules/<nombre>`
2. Registra el módulo en `src/shared/config/modules.ts` (aparece en la navegación).
3. Escribe su `CLAUDE.md`: qué dominio cubre, qué expone, qué invariantes tiene.
4. Migración SQL con tablas `home_<nombre>_*` + RLS.
