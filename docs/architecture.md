# Arquitectura

## Por qué monolito modular

La app la desarrolla una persona con ayuda de IA. Microservicios cobrarían costo de
infraestructura sin resolver ningún problema real aquí. Un monolito plano, en cambio, se
convierte en spaghetti justo cuando un agente empieza a editar archivos que no entiende del
todo. El punto medio: **un solo deploy, límites duros entre dominios**.

Un módulo es una carpeta en `src/modules/` con un `index.ts` que es su única puerta de
entrada. ESLint (`eslint-plugin-boundaries`) bloquea cualquier import que se salte esa puerta.

## Por qué esto ayuda al desarrollo con IA

| Problema típico al programar con IA | Cómo lo ataja esta arquitectura |
| ----------------------------------- | ------------------------------- |
| El agente toca código no relacionado y rompe otra cosa | Los módulos están aislados; ESLint falla si cruza el límite |
| El agente no sabe cuál es la forma correcta de los datos | Los schemas de Zod son la única fuente de verdad, en un archivo por módulo |
| El agente reinventa decisiones ya tomadas | Cada módulo tiene su `CLAUDE.md` con dominio, contrato e invariantes |
| El agente inventa columnas que no existen | Los tipos salen generados de la BD (`npm run db:types`) |
| El agente cree que validar en el cliente basta | RLS en Postgres: aunque el código falle, la BD no entrega datos ajenos |
| El agente dice "listo" sin verificar | `npm run check` corre typecheck + lint + tests en un comando |

El contexto que un agente necesita para trabajar en finanzas cabe en
`AGENTS.md` + `src/modules/finance/CLAUDE.md` + la carpeta del módulo. No necesita leer el
resto del repo, y el linter lo detiene si intenta usarlo.

## Capas

```
app/       Routing y composición. Sin lógica de negocio.
modules/   Dominios. Cada uno es dueño de sus tablas, schemas y reglas.
shared/    Infra transversal: Supabase, sesión, env, registro de módulos.
lib/       Utilidades puras. No importa nada del proyecto.
```

Las flechas apuntan siempre hacia abajo. `shared` no conoce ningún módulo: si necesitara
conocerlo, es señal de que eso pertenece al módulo.

## Autenticación

- `src/proxy.ts` (el ex `middleware.ts`; Next 16 lo renombró) refresca el token de Supabase
  en cada request y redirige a `/login` si no hay sesión. Es un atajo de UX, no seguridad.
- `src/app/(app)/layout.tsx` llama a `requireUser()` en el servidor.
- **Cada Server Action vuelve a llamar `requireUser()`.** Las Server Actions son endpoints
  HTTP: cualquiera puede invocarlas directo, sin pasar por el layout.
- La seguridad real es RLS en Postgres. Las tres capas anteriores son conveniencia.

## Base de datos

El proyecto de Supabase (`Axl-Projects`) es compartido con otras apps por el límite de dos
proyectos del plan gratuito. Por eso **todo objeto de esta app lleva prefijo `home_`**:
tablas, funciones y triggers. Sin el prefijo habría colisión con `ra_*` y `adala_*`.

Migraciones en `supabase/migrations/`, numeradas. Después de aplicar una, correr
`npm run db:types` para que los tipos de TypeScript reflejen la BD.

## Decisiones pendientes

- **Modelo de datos de finanzas.** Ver `src/modules/finance/CLAUDE.md`.
- **`cacheComponents`.** Apagado por ahora: casi todo son datos por usuario y dinámicos, así
  que el caching agregaría complejidad sin ganancia. Vale la pena revisarlo si aparecen
  vistas con datos compartidos.
